import vm from "vm";
import { exec } from "child_process";
import { writeFile, unlink, mkdir } from "fs/promises";
import { promisify } from "util";
import path from "path";
import os from "os";
import crypto from "crypto";

const execAsync = promisify(exec);

export type SupportedLanguage = "javascript" | "typescript" | "python" | "unknown";

export interface CodeExecutionResult {
  language: SupportedLanguage;
  code: string;
  stdout: string;
  stderr: string;
  error: string | null;
  executionTimeMs: number;
  timedOut: boolean;
}

// Execution limits
const JS_TIMEOUT_MS = 8000;
const PYTHON_TIMEOUT_MS = 12000;
const MAX_OUTPUT_CHARS = 8000;

/**
 * Detect language from markdown code fence or heuristics.
 */
export function detectLanguage(code: string, hint?: string): SupportedLanguage {
  if (hint) {
    const h = hint.toLowerCase().trim();
    if (h === "js" || h === "javascript") return "javascript";
    if (h === "ts" || h === "typescript") return "typescript";
    if (h === "py" || h === "python") return "python";
  }

  // Python heuristics
  const pythonPatterns = [
    /^\s*def\s+\w+\s*\(/m,
    /^\s*import\s+\w+/m,
    /^\s*from\s+\w+\s+import/m,
    /^\s*print\s*\(/m,
    /:\s*$/m,
  ];
  const pythonScore = pythonPatterns.filter((p) => p.test(code)).length;

  // JS heuristics
  const jsPatterns = [
    /^\s*const\s+/m,
    /^\s*let\s+/m,
    /^\s*function\s+\w+/m,
    /console\.log/,
    /=>/,
    /require\s*\(/,
    /module\.exports/,
  ];
  const jsScore = jsPatterns.filter((p) => p.test(code)).length;

  if (pythonScore > jsScore) return "python";
  if (jsScore > 0) return "javascript";
  return "unknown";
}

/**
 * Extracts code blocks from a markdown string.
 * Returns { code, language } for the first code block found,
 * or treats the whole string as code if no fences found.
 */
export function extractCodeFromMarkdown(text: string): { code: string; language: string } | null {
  // Match ```language\n...\n```
  const fenceMatch = text.match(/```(\w*)\n([\s\S]*?)```/);
  if (fenceMatch) {
    return {
      language: fenceMatch[1] || "",
      code: fenceMatch[2].trim(),
    };
  }

  // Match ` single backtick inline
  const inlineMatch = text.match(/`([^`]+)`/);
  if (inlineMatch) {
    return { language: "", code: inlineMatch[1].trim() };
  }

  return null;
}

/**
 * Runs JavaScript in a Node.js vm sandbox.
 * - Captures console.log, console.error, console.warn output
 * - Enforces timeout
 * - Provides safe subset of globals (Math, JSON, Date, Array, Object, etc.)
 * - Blocks dangerous APIs (process, require, fs, net, child_process)
 */
async function runJavaScript(code: string): Promise<CodeExecutionResult> {
  const start = Date.now();
  const outputLines: string[] = [];
  const errorLines: string[] = [];
  let timedOut = false;
  let caughtError: string | null = null;

  // Safe console mock
  const consoleMock = {
    log: (...args: any[]) => outputLines.push(args.map(safeStringify).join(" ")),
    error: (...args: any[]) => errorLines.push(args.map(safeStringify).join(" ")),
    warn: (...args: any[]) => outputLines.push("[warn] " + args.map(safeStringify).join(" ")),
    info: (...args: any[]) => outputLines.push(args.map(safeStringify).join(" ")),
    table: (data: any) => outputLines.push(safeStringify(data)),
    dir: (data: any) => outputLines.push(safeStringify(data)),
  };

  // Sandbox — only safe globals, no process/require/fs
  const sandbox = vm.createContext({
    console: consoleMock,
    Math,
    JSON,
    Date,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Map,
    Set,
    Promise,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURIComponent,
    decodeURIComponent,
    setTimeout: (fn: Function, ms: number) => {
      // Allow setTimeout but cap at 5s
      return setTimeout(fn, Math.min(ms, 5000));
    },
    clearTimeout,
    // Provide a safe print alias
    print: (...args: any[]) => outputLines.push(args.map(safeStringify).join(" ")),
  });

  try {
    const script = new vm.Script(code, { filename: "nexus_sandbox.js" });
    // Run with timeout
    const result = script.runInContext(sandbox, { timeout: JS_TIMEOUT_MS });

    // If the last expression returned a value, show it
    if (result !== undefined && outputLines.length === 0) {
      outputLines.push(safeStringify(result));
    }
  } catch (err: any) {
    if (err.code === "ERR_SCRIPT_EXECUTION_TIMEOUT" || err.message?.includes("timed out")) {
      timedOut = true;
      caughtError = `Execution timed out after ${JS_TIMEOUT_MS / 1000}s`;
    } else {
      caughtError = err.message || String(err);
      errorLines.push(err.stack || err.message);
    }
  }

  return {
    language: "javascript",
    code,
    stdout: truncate(outputLines.join("\n")),
    stderr: truncate(errorLines.join("\n")),
    error: caughtError,
    executionTimeMs: Date.now() - start,
    timedOut,
  };
}

/**
 * Runs Python via child_process in a temp file.
 * Requires Python 3 installed on the server.
 */
async function runPython(code: string): Promise<CodeExecutionResult> {
  const start = Date.now();
  const tmpDir = os.tmpdir();
  const fileId = crypto.randomBytes(8).toString("hex");
  const filePath = path.join(tmpDir, `nexus_${fileId}.py`);
  let timedOut = false;

  try {
    await writeFile(filePath, code, "utf8");

    const { stdout, stderr } = await execAsync(
      `python3 "${filePath}"`,
      {
        timeout: PYTHON_TIMEOUT_MS,
        maxBuffer: 1024 * 256, // 256kb max output
        env: {
          // Strip dangerous env vars, keep PATH for python to work
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          TMPDIR: tmpDir,
        },
      }
    );

    return {
      language: "python",
      code,
      stdout: truncate(stdout),
      stderr: truncate(stderr),
      error: null,
      executionTimeMs: Date.now() - start,
      timedOut: false,
    };
  } catch (err: any) {
    if (err.killed || err.signal === "SIGTERM") {
      timedOut = true;
    }
    return {
      language: "python",
      code,
      stdout: truncate(err.stdout || ""),
      stderr: truncate(err.stderr || err.message || ""),
      error: timedOut
        ? `Execution timed out after ${PYTHON_TIMEOUT_MS / 1000}s`
        : err.message || "Unknown error",
      executionTimeMs: Date.now() - start,
      timedOut,
    };
  } finally {
    // Always clean up temp file
    unlink(filePath).catch(() => {});
  }
}

/**
 * Main entry point — detects language and runs the appropriate executor.
 */
export async function runCode(
  code: string,
  languageHint?: string
): Promise<CodeExecutionResult> {
  const lang = detectLanguage(code, languageHint);

  if (lang === "python") {
    return runPython(code);
  }

  // Default to JS for javascript, typescript, unknown
  // For TypeScript we strip types with a simple regex (good enough for most snippets)
  let execCode = code;
  if (lang === "typescript") {
    execCode = stripTypeScriptTypes(code);
  }

  return runJavaScript(execCode);
}

/**
 * Formats execution result into a clean string for Gemini to summarise.
 */
export function formatExecutionResult(result: CodeExecutionResult): string {
  const lines: string[] = [
    `Code Execution Result (${result.language})`,
    `Time: ${result.executionTimeMs}ms`,
    "",
  ];

  if (result.timedOut) {
    lines.push(`⚠️ TIMED OUT: ${result.error}`, "");
  }

  if (result.stdout) {
    lines.push("Output:", result.stdout, "");
  }

  if (result.stderr) {
    lines.push("Stderr:", result.stderr, "");
  }

  if (result.error && !result.timedOut) {
    lines.push("Error:", result.error, "");
  }

  if (!result.stdout && !result.stderr && !result.error) {
    lines.push("(No output produced)");
  }

  return lines.join("\n");
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeStringify(val: any): string {
  if (val === null) return "null";
  if (val === undefined) return "undefined";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}

function truncate(str: string): string {
  if (str.length <= MAX_OUTPUT_CHARS) return str;
  return str.slice(0, MAX_OUTPUT_CHARS) + `\n... [output truncated at ${MAX_OUTPUT_CHARS} chars]`;
}

/**
 * Very basic TypeScript type stripping for simple snippets.
 * Handles: type annotations, interfaces, type aliases, generics on functions.
 * NOT a full TS compiler — covers 90% of typical chat snippets.
 */
function stripTypeScriptTypes(code: string): string {
  return code
    // Remove interface blocks
    .replace(/\binterface\s+\w+\s*\{[^}]*\}/gs, "")
    // Remove type alias declarations
    .replace(/\btype\s+\w+\s*=\s*[^;]+;/g, "")
    // Remove type annotations on variables: const x: string =
    .replace(/:\s*(string|number|boolean|any|void|null|undefined|never|object|unknown)(\[\])?/g, "")
    // Remove generic type params on functions: function foo<T>(
    .replace(/<[A-Z]\w*>/g, "")
    // Remove return type annotations: ): string {
    .replace(/\)\s*:\s*\w+(\[\])?\s*\{/g, ") {")
    // Remove access modifiers
    .replace(/\b(public|private|protected|readonly)\s+/g, "")
    .trim();
}

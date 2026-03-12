import { GoogleGenerativeAI, SchemaType, Tool } from "@google/generative-ai";
import * as dotenv from "dotenv";
import { performDeleteThread } from "../controllers/threadController.js";
import { runWebSearch, formatSearchResultsForPrompt } from "./tools/webSearch.js";
import { runCode, extractCodeFromMarkdown, detectLanguage, formatExecutionResult } from "./tools/codeInterpreter.js";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ─── Tool Definitions ─────────────────────────────────────────────────────────

const allTools: Tool[] = [
  {
    functionDeclarations: [
      // ── 1. Delete Thread ──────────────────────────────────────────────────
      {
        name: "deleteThread",
        description: "Deletes the current chat thread and all its history from the database.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            threadId: {
              type: SchemaType.STRING,
              description: "The unique ID of the thread to delete.",
            },
          },
          required: ["threadId"],
        },
      },

      // ── 2. Web Search ─────────────────────────────────────────────────────
      {
        name: "webSearch",
        description: `Search the internet for real-time information. 
          Use this when the user asks about:
          - Current events, news, prices, weather, sports scores
          - Anything that may have changed recently
          - Topics you are not confident about or that need up-to-date data
          - Specific URLs, companies, people, products
          DO NOT use for general knowledge you already have.`,
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: {
              type: SchemaType.STRING,
              description: "A precise, search-engine-optimised query string. Be specific.",
            },
            searchDepth: {
              type: SchemaType.STRING,
              description: "Use 'basic' for simple lookups, 'advanced' for research queries.",
            },
            maxResults: {
              type: SchemaType.NUMBER,
              description: "Number of results to fetch. Default 5, max 10.",
            },
          },
          required: ["query"],
        },
      },

      // ── 3. Execute Code ───────────────────────────────────────────────────
      {
        name: "executeCode",
        description: `ALWAYS call this tool when there is any code to run, test, execute, or verify.
          NEVER guess or predict code output — always call this tool to get the REAL output.
          Use this when the user:
          - Pastes code and asks what it outputs, does, or whether it works
          - Asks you to run, execute, test, or debug code
          - Asks you to calculate something using code
          - Says "run this", "test this", "what does this print/return/output"
          You MUST call this even if you already know the answer — the user wants REAL execution.
          Supports: JavaScript, TypeScript, Python.`,
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            code: {
              type: SchemaType.STRING,
              description: "The exact code to execute. Clean code only, no markdown fences.",
            },
            language: {
              type: SchemaType.STRING,
              description: "Language: 'javascript', 'typescript', or 'python'.",
            },
          },
          required: ["code", "language"],
        },
      },
    ],
  },
];

// ─── Tool Executor ────────────────────────────────────────────────────────────

interface ToolCallResult {
  success: boolean;
  output: string;
  [key: string]: any;
}

async function executeTool(
  name: string,
  args: Record<string, any>,
  userId: string,
  threadId: string
): Promise<ToolCallResult> {
  switch (name) {

    case "deleteThread": {
      const idToUse = args.threadId || threadId;
      const result = await performDeleteThread(userId, idToUse);
      return { success: true, output: JSON.stringify(result) };
    }

    case "webSearch": {
      const searchResult = await runWebSearch(args.query, {
        searchDepth: args.searchDepth || "advanced",
        maxResults: Math.min(args.maxResults || 5, 10),
        includeAnswer: true,
      });
      const formatted = formatSearchResultsForPrompt(searchResult);
      return {
        success: true,
        output: formatted,
        resultCount: searchResult.results.length,
        query: searchResult.query,
      };
    }

    case "executeCode": {
      let code = args.code as string;
      const extracted = extractCodeFromMarkdown(code);
      if (extracted) code = extracted.code;

      const result = await runCode(code, args.language);
      return {
        success: !result.error && !result.timedOut,
        output: result.stdout || "",
        stderr: result.stderr || "",
        error: result.error || "",
        executionTimeMs: result.executionTimeMs,
        timedOut: result.timedOut,
        language: result.language,
      };
    }

    default:
      return { success: false, output: `Unknown tool: ${name}` };
  }
}

// ─── Main Chat Generator ──────────────────────────────────────────────────────

export const geminiClient = {
  async *chat(
    prompt: string,
    userId: string,
    currentThreadId: string,
    history: any[] = []
  ): AsyncGenerator<string> {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      systemInstruction: `You are Nexus AI — a highly capable AI assistant with access to real-time web search and code execution.

TOOLS AVAILABLE:
1. webSearch — search the internet for current, real-time information
2. executeCode — ACTUALLY run code in a real sandbox and return the real output
3. deleteThread — delete the current conversation thread

CRITICAL RULES — YOU MUST FOLLOW THESE EXACTLY:

RULE 1 — CODE EXECUTION (MOST IMPORTANT):
- ANY time there is code in the conversation that needs to be run, tested, or verified → you MUST call executeCode
- You are NOT allowed to predict, guess, or calculate code output yourself
- You MUST wait for the real executeCode result before responding
- NEVER say what the output "would be" or "is" without calling executeCode first
- Even if you are 100% certain of the output, you MUST still call executeCode
- After executeCode returns, present the ACTUAL stdout/stderr from the result exactly as given

RULE 2 — WEB SEARCH:
- Any question about current events, news, prices, scores, recent releases → call webSearch
- Do not answer from your training data if the info could be outdated
- After webSearch returns, cite sources with URLs

RULE 3 — THREAD DELETION:
- If user asks to delete/clear this chat → call deleteThread with threadId: ${currentThreadId}

RULE 4 — NEVER BYPASS TOOLS:
- Do not answer what code outputs without running it
- Do not answer current events questions without searching
- The current thread ID is: ${currentThreadId}

RULE 5 — HOW TO PRESENT CODE EXECUTION RESULTS:
- After executeCode returns, your response MUST start with the actual output
- Format it exactly as: **Output:** then a code block with the real stdout
- If there was an error: **Error:** then a code block with the real stderr
- Only AFTER showing the real output may you add a brief explanation
- NEVER describe what the output would be without showing the real stdout first`,
      tools: allTools as any,
      toolConfig: { functionCallingConfig: { mode: "AUTO" as any } },
    });

    const chatHistory = history.flatMap((msg) => [
      { role: "user", parts: [{ text: msg.prompt }] },
      { role: "model", parts: [{ text: msg.reply }] },
    ]);

    const chat = model.startChat({ history: chatHistory });

    // We may need multiple rounds of tool calls before a final text response
    // (e.g. search → summarise → run code → explain output)
    let currentMessages: any[] = [prompt];
    let roundsLeft = 5; // max tool call rounds to prevent infinite loops

    while (roundsLeft-- > 0) {
      const result = await chat.sendMessageStream(currentMessages);

      // Accumulate the full response for this round
      let roundText = "";
      const pendingToolCalls: Array<{ name: string; args: Record<string, any> }> = [];

      for await (const chunk of result.stream) {
        // Collect text chunks
        const text = chunk.text();
        if (text) {
          roundText += text;
          yield text; // stream text to client immediately
        }

        // Collect function calls (may come mid-stream or at end)
        const calls = chunk.functionCalls();
        if (calls && calls.length > 0) {
          for (const call of calls) {
            pendingToolCalls.push({ name: call.name, args: call.args as Record<string, any> });
          }
        }
      }

      // No tool calls — we're done, final response already streamed
      if (pendingToolCalls.length === 0) {
        return;
      }

      // We have tool calls to execute
      // Yield a subtle indicator so user knows what's happening
      if (pendingToolCalls.length > 0) {
        const toolNames = pendingToolCalls.map((t) => {
          if (t.name === "webSearch") return `🔍 Searching: "${t.args.query}"`;
          if (t.name === "executeCode") return `⚙️ Running ${t.args.language} code...`;
          if (t.name === "deleteThread") return `🗑️ Deleting thread...`;
          return `🔧 ${t.name}`;
        });
        // Only yield the indicator if no text was streamed yet this round
        if (!roundText) {
          yield toolNames.join("\n") + "\n\n";
        }
      }

      // Execute all tool calls in parallel where safe
      const toolResponses = await Promise.all(
        pendingToolCalls.map(async (tc) => {
          try {
            const toolResult = await executeTool(tc.name, tc.args, userId, currentThreadId);
            return {
              functionResponse: {
                name: tc.name,
                response: {
                  ...toolResult,
                  // Force model to present actual output, not its own knowledge
                  instruction: tc.name === "executeCode"
                    ? "Show the result using the fields provided. 'output' is stdout, 'stderr' is error output, 'error' is the exception message. Format: **Output:** then a code block with the stdout value only. If error/stderr exist show those too. Do not wrap in extra metadata."
                    : tc.name === "webSearch"
                    ? "Present the search results below. Cite sources with URLs."
                    : undefined,
                },
              },
            };
          } catch (err: any) {
            return {
              functionResponse: {
                name: tc.name,
                response: {
                  success: false,
                  output: `Tool execution error: ${err.message}`,
                },
              },
            };
          }
        })
      );

      // Feed tool results back for next round
      currentMessages = toolResponses;
    }

    // Safety fallback if we hit round limit
    yield "\n\n⚠️ Reached maximum tool call rounds. Please try a more specific request.";
  },

  // ── Raw call (no streaming, no tools) — used for background tasks like title generation
  async raw(prompt: string): Promise<string> {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  },
};
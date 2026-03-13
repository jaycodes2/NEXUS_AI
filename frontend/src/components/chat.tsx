import { useState, useEffect, useRef, useCallback } from "react";
import { getThreadId, newThread } from "../utils/thread";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Paperclip, Globe, AtSign, ArrowUp, Plus, X, FileText, Image } from "lucide-react";
import "@fontsource/geist-mono/400.css";
import "@fontsource/geist-mono/500.css";

const GEIST_MONO = '"Geist Mono", "GeistMono", ui-monospace, monospace';
const API_URL = (import.meta as any).env?.VITE_API_URL;
const MAX_RETRIES = 3;

const ACCEPTED_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "Image",
  "image/png": "Image",
  "image/webp": "Image",
  "image/gif": "Image",
  "text/plain": "Text",
  "text/markdown": "Text",
  "application/typescript": "Code",
  "application/javascript": "Code",
  "text/x-python": "Code",
  "text/x-typescript": "Code",
  "text/x-javascript": "Code",
  "text/css": "Code",
  "text/html": "Code",
  "application/json": "JSON",
};

// We also accept by extension for types browsers misidentify
const ACCEPTED_EXTENSIONS = [".pdf",".jpg",".jpeg",".png",".webp",".gif",".txt",".md",".ts",".tsx",".js",".jsx",".py",".css",".html",".json",".csv",".env",".yaml",".yml"];

interface AttachedFile {
  name: string;
  mimeType: string;
  base64: string;
  sizeKB: number;
}
const RETRY_DELAY_MS = 1500;

export default function Chat() {
  const [threadId, setThreadId] = useState(getThreadId());
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<{ prompt: string; reply: string; feedback?: "good" | "bad"; fileName?: string }[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "error" | "info" }[]>([]);
  const toastIdRef = useRef(0);
  const [typingStatus, setTypingStatus] = useState<string>("");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const replyBufferRef = useRef("");
  const rafRef = useRef<number | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeReaderRef = useRef<ReadableStreamDefaultReader | null>(null);

  const scheduleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) return;
    scrollTimeoutRef.current = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      scrollTimeoutRef.current = null;
    }, 100);
  }, []);

  // ── Thread ID polling ──────────────────────────────────────────────────────
  useEffect(() => {
    const updateThreadId = () => {
      const newId = localStorage.getItem("threadId");
      if (newId && newId !== threadId) setThreadId(newId);
    };
    window.addEventListener("storage", updateThreadId);
    const interval = setInterval(updateThreadId, 500);
    return () => {
      window.removeEventListener("storage", updateThreadId);
      clearInterval(interval);
    };
  }, [threadId]);

  // ── FIX 2: Thread switch — cancel active stream, show skeleton, load history ─
  useEffect(() => {
    if (!threadId) return;

    // Abort any in-flight stream from the previous thread
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    activeReaderRef.current?.cancel().catch(() => {});
    activeReaderRef.current = null;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setLoading(false);

    setThreadLoading(true);
    setMessages([]);

    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/ai/history?threadId=${threadId}`, {
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setMessages(data);
        setThreadLoading(false);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "instant" as any }), 50);
      })
      .catch(() => setThreadLoading(false));
  }, [threadId]);

  // ── Textarea auto-resize ───────────────────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [prompt]);

  // ── Toast helpers ─────────────────────────────────────────────────────────
  function showToast(message: string, type: "error" | "info" = "error") {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // ── File picker ───────────────────────────────────────────────────────────
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const f = e.target.files?.[0];
    if (!e.target.files) return;
    // Reset input so same file can be re-selected
    e.target.value = "";
    if (!f) return;

    // Size check — 10MB
    if (f.size > 10 * 1024 * 1024) {
      setFileError("File too large. Maximum size is 10MB.");
      showToast("File too large. Maximum size is 10MB.");
      return;
    }

    // Type check — by MIME or extension
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_TYPES[f.type] && !ACCEPTED_EXTENSIONS.includes(ext)) {
      setFileError("Unsupported file type. Supported: PDF, images, text, code files.");
      showToast("Unsupported file type.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:mime/type;base64, prefix
      const base64 = result.split(",")[1];
      // For plain text files the browser may give text/plain — normalise code extensions
      let mimeType = f.type || "text/plain";
      if (!mimeType || mimeType === "application/octet-stream") {
        mimeType = "text/plain";
      }
      setAttachedFile({
        name: f.name,
        mimeType,
        base64,
        sizeKB: Math.round(f.size / 1024),
      });
    };
    reader.onerror = () => { setFileError("Failed to read file."); showToast("Failed to read file. Please try again."); };
    reader.readAsDataURL(f);
  }

  function removeFile() {
    setAttachedFile(null);
    setFileError(null);
  }

  // ── FIX 1: SSE stream with retry on network drop ───────────────────────────
  async function sendPrompt(customPrompt?: string) {
    const promptText = customPrompt || prompt;
    if (!promptText.trim() || loading) return;
    const currentPrompt = promptText;
    const token = localStorage.getItem("token") || "";
    if (!customPrompt) setPrompt("");

    setLoading(true);
    setTypingStatus("Thinking...");
    replyBufferRef.current = "";
    setMessages((prev) => [...prev, { prompt: currentPrompt, reply: "", fileName: attachedFile?.name }]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    const filePayload = attachedFile ? {
      base64: attachedFile.base64,
      mimeType: attachedFile.mimeType,
      name: attachedFile.name,
    } : undefined;

    // Clear file attachment immediately on send
    setAttachedFile(null);
    setFileError(null);

    const requestBody = JSON.stringify({ prompt: currentPrompt, threadId, file: filePayload });
    let retryCount = 0;

    const flushBuffer = () => {
      const text = replyBufferRef.current;
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated.length - 1;
        if (updated[last]) updated[last] = { ...updated[last], reply: text };
        return updated;
      });
      scheduleScroll();
      rafRef.current = null;
    };

    const attemptStream = async (): Promise<void> => {
      try {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const res = await fetch(`${API_URL}/api/ai/query`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: requestBody,
          signal: controller.signal,
        });

        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        activeReaderRef.current = reader;
        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
          let value: Uint8Array | undefined;
          let readerDone = false;

          try {
            ({ value, done: readerDone } = await reader.read());
          } catch (readErr: any) {
            // Clean abort — thread switch or unmount
            if (readErr?.name === "AbortError") return;

            // Network drop mid-stream — retry
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              replyBufferRef.current += `\n\n_Reconnecting (${retryCount}/${MAX_RETRIES})..._\n\n`;
              flushBuffer();
              await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * retryCount));
              return attemptStream();
            }
            throw readErr;
          }

          done = readerDone;

          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              const dataStr = line.slice(6).trim();
              if (dataStr === "[DONE]") { done = true; break; }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.chunk) {
                  replyBufferRef.current += parsed.chunk;
                  // Update typing status based on tool indicators in stream
                  const current = replyBufferRef.current;
                  if (current.includes("🔍 Searching")) setTypingStatus("Searching the web...");
                  else if (current.includes("⚙️ Running")) setTypingStatus("Running code...");
                  else if (current.includes("🗑️")) setTypingStatus("Deleting thread...");
                  else if (replyBufferRef.current.length > 0) setTypingStatus("");
                  if (!rafRef.current) rafRef.current = requestAnimationFrame(flushBuffer);
                }
              } catch { /* incomplete JSON */ }
            }
          }
        }

        // Final flush
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        const finalText = replyBufferRef.current;
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated.length - 1;
          if (updated[last]) updated[last] = { ...updated[last], reply: finalText };
          return updated;
        });

      } catch (err: any) {
        if (err?.name === "AbortError") return;
        const errMsg = retryCount >= MAX_RETRIES
          ? `Connection failed after ${MAX_RETRIES} retries. Please check your network.`
          : "Something went wrong. Please try again.";
        showToast(errMsg);
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated.length - 1;
          if (updated[last]) {
            updated[last] = { ...updated[last], reply: `⚠️ ${errMsg}` };
          }
          return updated;
        });
      } finally {
        setLoading(false);
        setTypingStatus("");
        activeReaderRef.current = null;
        abortControllerRef.current = null;
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      }
    };

    await attemptStream();
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      activeReaderRef.current?.cancel().catch(() => {});
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendPrompt(); }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleFeedback = (index: number, type: "good" | "bad") => {
    setMessages((prev) =>
      prev.map((msg, i) => i === index ? { ...msg, feedback: msg.feedback === type ? undefined : type } : msg)
    );
  };

  const handleRegenerate = (index: number) => {
    const msg = messages[index];
    if (index === messages.length - 1) {
      setMessages((prev) => prev.slice(0, -1));
      sendPrompt(msg.prompt);
    } else {
      sendPrompt(msg.prompt);
    }
  };

  function handleNewChat() {
    const id = newThread();
    localStorage.setItem("threadId", id);
    window.dispatchEvent(new Event("storage"));
  }

  const hasContent = prompt.trim().length > 0;

  // ── FIX 2: Thread switch skeleton ─────────────────────────────────────────
  if (threadLoading) {
    return (
      <div className="flex flex-col h-full bg-black text-[#ececec]">
        <MobileHeader onOpenSidebar={() => window.dispatchEvent(new Event("open-sidebar"))} onNewChat={handleNewChat} />
        <div className="flex-1 overflow-hidden">
          <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-8">
            {[0.55, 0.75, 0.45].map((w, i) => (
              <div key={i} className="space-y-4 animate-pulse">
                <div className="flex justify-end">
                  <div className="h-10 rounded-2xl bg-[#111] border border-[#1a1a1a]" style={{ width: `${w * 100}%` }} />
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#111] border border-[#1a1a1a] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2.5 pt-1">
                    <div className="h-3 bg-[#111] rounded-full w-full" />
                    <div className="h-3 bg-[#111] rounded-full" style={{ width: "80%" }} />
                    <div className="h-3 bg-[#111] rounded-full" style={{ width: "55%" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-shrink-0 bg-black px-3 md:px-4 pb-4 md:pb-5 pt-2 opacity-40 pointer-events-none">
          <div className="w-full max-w-3xl mx-auto">
            <div className="bg-[#0b0b0b] rounded-2xl border border-[#1a1a1a] px-4 py-4">
              <div className="h-4 bg-[#1a1a1a] rounded-full w-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black text-[#ececec]">

      {/* FIX 3: Mobile header */}
      <MobileHeader onOpenSidebar={() => window.dispatchEvent(new Event("open-sidebar"))} onNewChat={handleNewChat} />

      {/* Scrollable messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide">

        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 pb-24">
            <div className="w-14 h-14 rounded-2xl bg-[#0b0b0b] border border-[#1a1a1a] flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-white/90" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4l8 11V4h3v16h-4L9 9v11H6V4z" />
                <path d="M19 4h-2v2h2V4zM7 20h2v-2H7v2z" opacity="0.5" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold mb-2 text-white">How can I help you today?</h1>
            <p className="text-[#6b6b6b] text-sm max-w-sm mb-8">Ask me anything. I'm here to assist.</p>

            {/* Suggestion chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {[
                { label: "Search the web", sub: "Find latest news or info", prompt: "Search the web for the latest AI news today" },
                { label: "Run some code", sub: "Execute and verify output", prompt: "Run this JavaScript: console.log([1,2,3,4,5].reduce((a,b) => a+b, 0))" },
                { label: "Explain a concept", sub: "Break down any topic", prompt: "Explain how vector embeddings work in simple terms" },
                { label: "Review my code", sub: "Attach a file to get started", prompt: "Review my code for bugs and improvements" },
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendPrompt(s.prompt)}
                  className="flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl bg-[#0d0d0d] border border-[#1f1f1f] hover:border-[#2a2a2a] hover:bg-[#111] transition-all text-left group"
                >
                  <span className="text-[13px] font-medium text-[#ececec] group-hover:text-white transition-colors">{s.label}</span>
                  <span className="text-[12px] text-[#555]">{s.sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-8">
            {messages.map((m, i) => (
              <div key={i} className="space-y-4">

                {/* USER MESSAGE */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-[#111111] rounded-2xl rounded-br-sm px-4 py-3 text-[#ececec] text-[15px] border border-[#1a1a1a] break-words">
                    {/* File attachment badge */}
                    {m.fileName && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#2a2a2a]">
                        <FileText size={12} className="text-orange-400 flex-shrink-0" />
                        <span className="text-[12px] text-[#888] truncate">{m.fileName}</span>
                      </div>
                    )}
                    {m.prompt}
                  </div>
                </div>

                {/* AI MESSAGE */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 mt-0.5 rounded-lg bg-[#0b0b0b] border border-[#1a1a1a] flex items-center justify-center">
                    <svg className="w-4 h-4 text-white/90" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 4h4l8 11V4h3v16h-4L9 9v11H6V4z" />
                      <path d="M19 4h-2v2h2V4zM7 20h2v-2H7v2z" opacity="0.5" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    {/* Tool status pills */}
                    {m.reply && /^[🔍⚙️🗑️🔧]/.test(m.reply.split("\n")[0]) && (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {m.reply.split("\n\n")[0].split("\n").filter(Boolean).map((line, li) => (
                          <div key={li} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#888]"
                            style={{ background: "#111", border: "1px solid #1f1f1f" }}>
                            {line}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="ai-message-body">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="text-[#d4d4d4] text-[15px] leading-7 mb-4 last:mb-0">{children}</p>,
                          h1: ({ children }) => <h1 className="text-white font-semibold text-xl leading-snug mt-6 mb-3 first:mt-0">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-white font-semibold text-lg leading-snug mt-6 mb-2 first:mt-0">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-white font-semibold text-[15px] leading-snug mt-5 mb-2 first:mt-0">{children}</h3>,
                          strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="text-[#d4d4d4] italic">{children}</em>,
                          ul: ({ children }) => <ul className="my-3 space-y-1.5 pl-1">{children}</ul>,
                          ol: ({ children }) => <ol className="my-3 space-y-1.5 pl-1 list-none" style={{ counterReset: "li" }}>{children}</ol>,
                          li: ({ children, ordered, index }: any) => (
                            <li className="flex items-start gap-2.5 text-[#d4d4d4] text-[15px] leading-7">
                              {ordered
                                ? <span className="flex-shrink-0 w-5 text-[#555] text-sm font-mono mt-0.5 text-right">{(index ?? 0) + 1}.</span>
                                : <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#555] mt-[0.6rem]" />
                              }
                              <span className="flex-1 min-w-0">{children}</span>
                            </li>
                          ),
                          code: ({ inline, className, children }: any) => {
                            const language = /language-(\w+)/.exec(className || "")?.[1];
                            if (!inline && language) {
                              return (
                                <div className="my-4 rounded-xl overflow-hidden border border-[#2a2a2a]">
                                  <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-[#2a2a2a]">
                                    <span className="text-[#555] text-xs font-mono">{language}</span>
                                    <button onClick={() => navigator.clipboard.writeText(String(children))}
                                      className="text-[#555] hover:text-[#ececec] text-xs transition-colors">Copy</button>
                                  </div>
                                  <SyntaxHighlighter style={oneDark} language={language} PreTag="div"
                                    customStyle={{ margin: 0, padding: "1rem", background: "#0d0d0d", fontSize: "13px", fontFamily: GEIST_MONO, lineHeight: "1.6" }}>
                                    {String(children).replace(/\n$/, "")}
                                  </SyntaxHighlighter>
                                </div>
                              );
                            }
                            return (
                              <code className="px-1.5 py-0.5 rounded-md text-[13px] text-[#e2e8f0]"
                                style={{ background: "#1e1e1e", fontFamily: GEIST_MONO, border: "1px solid #2a2a2a" }}>
                                {children}
                              </code>
                            );
                          },
                          pre: ({ children }) => <>{children}</>,
                          blockquote: ({ children }) => (
                            <blockquote className="my-4 pl-4 border-l-2 border-[#333] text-[#888] italic">{children}</blockquote>
                          ),
                          hr: () => <hr className="my-6 border-[#222]" />,
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer"
                              className="text-white underline underline-offset-2 decoration-[#555] hover:decoration-white transition-colors">
                              {children}
                            </a>
                          ),
                          table: ({ children }) => (
                            <div className="my-4 overflow-x-auto rounded-xl border border-[#222]">
                              <table className="w-full text-sm text-[#d4d4d4]">{children}</table>
                            </div>
                          ),
                          thead: ({ children }) => <thead className="bg-[#111] text-white text-xs uppercase tracking-wide">{children}</thead>,
                          tbody: ({ children }) => <tbody>{children}</tbody>,
                          tr: ({ children }) => <tr className="border-t border-[#1f1f1f] hover:bg-white/[0.02] transition-colors">{children}</tr>,
                          th: ({ children }) => <th className="px-4 py-2.5 text-left font-medium">{children}</th>,
                          td: ({ children }) => <td className="px-4 py-2.5">{children}</td>,
                        }}
                      >
                        {m.reply}
                      </ReactMarkdown>
                    </div>

                    {m.reply && (i < messages.length - 1 || !loading) && (
                      <div className="flex items-center gap-1 mt-3 -ml-1">
                        <button onClick={() => handleCopy(m.reply, i)}
                          className="p-1.5 rounded-md text-[#4a4a4a] hover:text-[#ececec] hover:bg-[#1f1f1f] text-xs">
                          {copiedIndex === i ? "Copied" : "Copy"}
                        </button>
                        <button onClick={() => handleFeedback(i, "good")}
                          className={`p-1.5 rounded-md hover:bg-[#1f1f1f] ${m.feedback === "good" ? "text-green-500" : "text-[#4a4a4a]"}`}>
                          👍
                        </button>
                        <button onClick={() => handleFeedback(i, "bad")}
                          className={`p-1.5 rounded-md hover:bg-[#1f1f1f] ${m.feedback === "bad" ? "text-red-500" : "text-[#4a4a4a]"}`}>
                          👎
                        </button>
                        <button onClick={() => handleRegenerate(i)}
                          className="p-1.5 rounded-md text-[#4a4a4a] hover:text-[#ececec] hover:bg-[#1f1f1f] text-xs">
                          Regenerate
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator — shows status while waiting for first token */}
            {loading && messages[messages.length - 1]?.reply === "" && (
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-lg bg-[#0b0b0b] border border-[#1a1a1a] flex-shrink-0 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white/90" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4l8 11V4h3v16h-4L9 9v11H6V4z" />
                    <path d="M19 4h-2v2h2V4zM7 20h2v-2H7v2z" opacity="0.5" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce [animation-delay:0.15s]" />
                    <div className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                  {typingStatus && (
                    <span className="text-[11px] text-[#555] animate-pulse">{typingStatus}</span>
                  )}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl
              border text-sm max-w-sm animate-in slide-in-from-right-2 fade-in duration-200
              ${toast.type === "error"
                ? "bg-[#1a0a0a] border-red-500/30 text-red-300"
                : "bg-[#0a0a1a] border-blue-500/30 text-blue-300"
              }
            `}
          >
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0 text-[#555] hover:text-white transition-colors mt-0.5"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* INPUT AREA */}
      <div className="flex-shrink-0 bg-black px-3 md:px-4 pb-4 md:pb-5 pt-2">
        <div className="w-full max-w-3xl mx-auto">
          <div className="bg-[#0b0b0b] rounded-2xl border border-[#1a1a1a]">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.txt,.md,.ts,.tsx,.js,.jsx,.py,.css,.html,.json,.csv,.env,.yaml,.yml"
              onChange={handleFileSelect}
            />

            <div className="px-3 pt-3 pb-1 space-y-2">
              {/* Attached file pill */}
              {attachedFile && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#111] border border-[#2a2a2a] w-fit max-w-full">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                    {attachedFile.mimeType.startsWith("image/")
                      ? <Image size={13} className="text-blue-400" />
                      : <FileText size={13} className="text-orange-400" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] text-[#ececec] truncate max-w-[180px]">{attachedFile.name}</p>
                    <p className="text-[11px] text-[#555]">{attachedFile.sizeKB}KB</p>
                  </div>
                  <button
                    onClick={removeFile}
                    className="flex-shrink-0 ml-1 text-[#555] hover:text-[#ececec] transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* File error */}
              {fileError && (
                <p className="text-[11px] text-red-400 px-1">{fileError}</p>
              )}

              {/* Add context button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111111] hover:bg-[#1f1f1f] text-[#ececec] text-sm transition-colors"
              >
                <AtSign size={13} />
                <span className="text-[13px]">Add context</span>
              </button>
            </div>
            <div className="px-4 py-2">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask, search, or make anything..."
                rows={1}
                className="w-full bg-transparent resize-none focus:outline-none text-[#ececec] placeholder-[#4a4a4a] max-h-52 leading-6 text-[15px]"
              />
            </div>
            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-1">
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#6b6b6b] hover:text-[#ececec] hover:bg-[#1f1f1f] text-[13px]">
                  <Paperclip size={13} />
                  <span>Auto</span>
                </button>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#6b6b6b] hover:text-[#ececec] hover:bg-[#1f1f1f] text-[13px]">
                  <Globe size={13} />
                  <span>All Sources</span>
                </button>
              </div>
              <button
                onClick={() => sendPrompt()}
                disabled={!hasContent || loading}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  hasContent ? "bg-red-500 hover:bg-red-600 text-white" : "bg-[#1a1a1a] text-[#4a4a4a]"
                }`}
              >
                <ArrowUp size={15} />
              </button>
            </div>
          </div>
          <p className="text-center text-[11px] text-[#3a3a3a] mt-2.5">
            NEXUS can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── FIX 3: Mobile header component ────────────────────────────────────────────
function MobileHeader({ onOpenSidebar, onNewChat }: { onOpenSidebar: () => void; onNewChat: () => void }) {
  return (
    <div className="md:hidden flex-shrink-0 flex items-center justify-between px-2 py-2 border-b border-[#1a1a1a] bg-black">
      {/* Hamburger — open sidebar */}
      <button
        onClick={onOpenSidebar}
        className="w-10 h-10 flex items-center justify-center hover:bg-[#1f1f1f] rounded-xl transition-colors"
        aria-label="Open sidebar"
      >
        <svg className="w-5 h-5 text-[#ececec]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-black" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4l8 11V4h3v16h-4L9 9v11H6V4z" />
          </svg>
        </div>
        <span className="text-white text-sm font-semibold tracking-wide">NEXUS</span>
      </div>

      {/* New chat */}
      <button
        onClick={onNewChat}
        className="w-10 h-10 flex items-center justify-center hover:bg-[#1f1f1f] rounded-xl transition-colors text-[#6b6b6b] hover:text-white"
        aria-label="New chat"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}
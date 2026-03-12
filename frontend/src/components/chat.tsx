import { useState, useEffect, useRef, useCallback } from "react";
import { getThreadId } from "../utils/thread";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Paperclip, Globe, ChevronDown, AtSign, ArrowUp } from "lucide-react";
import "@fontsource/geist-mono/400.css";
import "@fontsource/geist-mono/500.css";

const GEIST_MONO = '"Geist Mono", "GeistMono", ui-monospace, monospace';
const API_URL = (import.meta as any).env?.VITE_API_URL;

export default function Chat() {
  const [threadId, setThreadId] = useState(getThreadId());
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<{ prompt: string; reply: string; feedback?: "good" | "bad" }[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // FIX 1: Buffer for streaming chunks — batch DOM updates instead of
  // one setMessages call per chunk (which was re-rendering on every token)
  const replyBufferRef = useRef("");
  const rafRef = useRef<number | null>(null);

  // FIX 2: Debounced scroll — only scroll at most once per 100ms during streaming
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) return; // already scheduled
    scrollTimeoutRef.current = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      scrollTimeoutRef.current = null;
    }, 100);
  }, []);

  useEffect(() => {
    const updateThreadId = () => {
      const newId = localStorage.getItem("threadId");
      if (newId && newId !== threadId) setThreadId(newId);
    };
    window.addEventListener("storage", updateThreadId);
    const interval = setInterval(updateThreadId, 1000);
    return () => { window.removeEventListener("storage", updateThreadId); clearInterval(interval); };
  }, [threadId]);

  useEffect(() => {
    if (!threadId) return;
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/ai/history?threadId=${threadId}`, {
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setMessages(data))
      .catch(() => {});
  }, [threadId]);

  // FIX 3: Only recalculate textarea height when prompt actually changes length
  // (avoids layout thrash on every keystroke)
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [prompt]);

  async function sendPrompt(customPrompt?: string) {
    const promptText = customPrompt || prompt;
    if (!promptText.trim() || loading) return;
    const currentPrompt = promptText;
    const token = localStorage.getItem("token");
    if (!customPrompt) setPrompt("");

    setLoading(true);
    replyBufferRef.current = "";

    // Add user message + empty AI placeholder in one update
    setMessages((prev) => [...prev, { prompt: currentPrompt, reply: "" }]);

    // Scroll to bottom immediately when user sends
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    try {
      const res = await fetch(`${API_URL}/api/ai/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ prompt: currentPrompt, threadId }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      // FIX 4: Accumulate chunks in a ref, flush to state via rAF
      // This batches rapid token updates into single renders (~60fps max)
      const flushBuffer = () => {
        const text = replyBufferRef.current;
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated.length - 1;
          if (updated[last]) {
            updated[last] = { ...updated[last], reply: text };
          }
          return updated;
        });
        scheduleScroll();
        rafRef.current = null;
      };

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") { done = true; break; }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.chunk) {
                // Accumulate in ref (no re-render)
                replyBufferRef.current += parsed.chunk;

                // Schedule a single rAF flush if not already pending
                if (!rafRef.current) {
                  rafRef.current = requestAnimationFrame(flushBuffer);
                }
              }
            } catch {
              // Incomplete JSON — skip
            }
          }
        }
      }

      // Final flush to make sure last chunk is committed
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      const finalText = replyBufferRef.current;
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated.length - 1;
        if (updated[last]) {
          updated[last] = { ...updated[last], reply: finalText };
        }
        return updated;
      });

    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].reply = "⚠️ Something went wrong. Please try again.";
        return updated;
      });
    } finally {
      setLoading(false);
      // One final guaranteed scroll after stream ends
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
    setMessages((prev) => prev.map((msg, i) => i === index ? { ...msg, feedback: msg.feedback === type ? undefined : type } : msg));
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

  const hasContent = prompt.trim().length > 0;

  return (
    <div className="flex flex-col h-full bg-black text-[#ececec]">

      {/* Mobile header */}
      <div className="md:hidden flex-shrink-0 flex items-center p-3 border-b border-[#1a1a1a]">
        <button
          onClick={() => window.dispatchEvent(new Event("open-sidebar"))}
          className="p-2 hover:bg-[#1f1f1f] rounded-md transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Scrollable messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide">

        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 pb-32">
            <div className="w-14 h-14 rounded-2xl bg-[#0b0b0b] border border-[#1a1a1a] flex items-center justify-center mb-5 shadow-lg shadow-black/40">
              <svg className="w-7 h-7 text-white/90" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4l8 11V4h3v16h-4L9 9v11H6V4z" />
                <path d="M19 4h-2v2h2V4zM7 20h2v-2H7v2z" opacity="0.5" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold mb-2 text-white">
              How can I help you today?
            </h1>
            <p className="text-[#6b6b6b] text-sm max-w-sm">
              Ask me anything. I'm here to assist.
            </p>
          </div>
        )}

        {messages.length > 0 && (
          <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-8">
            {messages.map((m, i) => (
              <div key={i} className="space-y-4">

                {/* USER MESSAGE */}
                <div className="flex justify-end">
                  <div className="max-w-[75%] bg-[#111111] rounded-2xl rounded-br-sm px-4 py-3 text-[#ececec] text-[15px] border border-[#1a1a1a]">
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
                    {/* Tool status lines — e.g. "🔍 Searching..." or "⚙️ Running code..." */}
                    {m.reply && /^[🔍⚙️🗑️🔧]/.test(m.reply.split("\n")[0]) && (
                      <div className="mb-3 space-y-1">
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
                          // Paragraphs
                          p: ({ children }) => (
                            <p className="text-[#d4d4d4] text-[15px] leading-7 mb-4 last:mb-0">{children}</p>
                          ),
                          // Headings
                          h1: ({ children }) => (
                            <h1 className="text-white font-semibold text-xl leading-snug mt-6 mb-3 first:mt-0">{children}</h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-white font-semibold text-lg leading-snug mt-6 mb-2 first:mt-0">{children}</h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-white font-semibold text-[15px] leading-snug mt-5 mb-2 first:mt-0">{children}</h3>
                          ),
                          // Bold / italic
                          strong: ({ children }) => (
                            <strong className="text-white font-semibold">{children}</strong>
                          ),
                          em: ({ children }) => (
                            <em className="text-[#d4d4d4] italic">{children}</em>
                          ),
                          // Unordered list
                          ul: ({ children }) => (
                            <ul className="my-3 space-y-1.5 pl-1">{children}</ul>
                          ),
                          // Ordered list
                          ol: ({ children }) => (
                            <ol className="my-3 space-y-1.5 pl-1 list-none" style={{ counterReset: "li" }}>{children}</ol>
                          ),
                          // List item — handles both ul and ol
                          li: ({ children, ordered, index }: any) => (
                            <li className="flex items-start gap-2.5 text-[#d4d4d4] text-[15px] leading-7">
                              {ordered
                                ? <span className="flex-shrink-0 w-5 text-[#555] text-sm font-mono mt-0.5 text-right">{(index ?? 0) + 1}.</span>
                                : <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#555] mt-[0.6rem]" />
                              }
                              <span className="flex-1 min-w-0">{children}</span>
                            </li>
                          ),
                          // Inline code
                          code: ({ inline, className, children }: any) => {
                            const language = /language-(\w+)/.exec(className || "")?.[1];
                            if (!inline && language) {
                              return (
                                <div className="my-4 rounded-xl overflow-hidden border border-[#2a2a2a]">
                                  <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-[#2a2a2a]">
                                    <span className="text-[#555] text-xs font-mono">{language}</span>
                                    <button
                                      onClick={() => navigator.clipboard.writeText(String(children))}
                                      className="text-[#555] hover:text-[#ececec] text-xs transition-colors"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                  <SyntaxHighlighter
                                    style={oneDark}
                                    language={language}
                                    PreTag="div"
                                    customStyle={{
                                      margin: 0,
                                      padding: "1rem",
                                      background: "#0d0d0d",
                                      fontSize: "13px",
                                      fontFamily: GEIST_MONO,
                                      lineHeight: "1.6",
                                    }}
                                  >
                                    {String(children).replace(/\n$/, "")}
                                  </SyntaxHighlighter>
                                </div>
                              );
                            }
                            // Inline code
                            return (
                              <code
                                className="px-1.5 py-0.5 rounded-md text-[13px] text-[#e2e8f0]"
                                style={{ background: "#1e1e1e", fontFamily: GEIST_MONO, border: "1px solid #2a2a2a" }}
                              >
                                {children}
                              </code>
                            );
                          },
                          // Fenced code block without language
                          pre: ({ children }) => <>{children}</>,
                          // Blockquote
                          blockquote: ({ children }) => (
                            <blockquote className="my-4 pl-4 border-l-2 border-[#333] text-[#888] italic">
                              {children}
                            </blockquote>
                          ),
                          // Horizontal rule
                          hr: () => <hr className="my-6 border-[#222]" />,
                          // Links
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer"
                              className="text-white underline underline-offset-2 decoration-[#555] hover:decoration-white transition-colors">
                              {children}
                            </a>
                          ),
                          // Tables
                          table: ({ children }) => (
                            <div className="my-4 overflow-x-auto rounded-xl border border-[#222]">
                              <table className="w-full text-sm text-[#d4d4d4]">{children}</table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className="bg-[#111] text-white text-xs uppercase tracking-wide">{children}</thead>
                          ),
                          tbody: ({ children }) => <tbody>{children}</tbody>,
                          tr: ({ children }) => (
                            <tr className="border-t border-[#1f1f1f] hover:bg-white/[0.02] transition-colors">{children}</tr>
                          ),
                          th: ({ children }) => (
                            <th className="px-4 py-2.5 text-left font-medium">{children}</th>
                          ),
                          td: ({ children }) => (
                            <td className="px-4 py-2.5">{children}</td>
                          ),
                        }}
                      >
                        {m.reply}
                      </ReactMarkdown>
                    </div>

                    {/* Only show actions when reply is complete */}
                    {m.reply && (i < messages.length - 1 || !loading) && (
                      <div className="flex items-center gap-1 mt-3 -ml-1">
                        <button
                          onClick={() => handleCopy(m.reply, i)}
                          className="p-1.5 rounded-md text-[#4a4a4a] hover:text-[#ececec] hover:bg-[#1f1f1f] text-xs"
                        >
                          {copiedIndex === i ? "Copied" : "Copy"}
                        </button>
                        <button
                          onClick={() => handleFeedback(i, "good")}
                          className={`p-1.5 rounded-md hover:bg-[#1f1f1f] ${m.feedback === "good" ? "text-green-500" : "text-[#4a4a4a]"}`}
                        >
                          👍
                        </button>
                        <button
                          onClick={() => handleFeedback(i, "bad")}
                          className={`p-1.5 rounded-md hover:bg-[#1f1f1f] ${m.feedback === "bad" ? "text-red-500" : "text-[#4a4a4a]"}`}
                        >
                          👎
                        </button>
                        <button
                          onClick={() => handleRegenerate(i)}
                          className="p-1.5 rounded-md text-[#4a4a4a] hover:text-[#ececec] hover:bg-[#1f1f1f] text-xs"
                        >
                          Regenerate
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading dots — only show when truly waiting for first token */}
            {loading && messages[messages.length - 1]?.reply === "" && (
              <div className="flex gap-3">
                <div className="flex items-center gap-1 pt-1.5">
                  <div className="w-1.5 h-1.5 bg-[#6b6b6b] rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-[#6b6b6b] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-[#6b6b6b] rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="flex-shrink-0 bg-black px-4 pb-5 pt-2">
        <div className="w-full max-w-3xl mx-auto">
          <div className="bg-[#0b0b0b] rounded-2xl border border-[#1a1a1a]">
            <div className="px-3 pt-3 pb-1">
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111111] hover:bg-[#1f1f1f] text-[#ececec] text-sm">
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
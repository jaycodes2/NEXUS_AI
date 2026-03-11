import { useState, useEffect, useRef } from "react";
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [prompt]);

  async function sendPrompt(customPrompt?: string) {
    const promptText = customPrompt || prompt;
    if (!promptText.trim() || loading) return;
    const currentPrompt = promptText;
    const token = localStorage.getItem("token");
    if (!customPrompt) setPrompt("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify({ prompt: currentPrompt, threadId }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { prompt: currentPrompt, reply: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { prompt: currentPrompt, reply: "⚠️ Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

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
    if (index === messages.length - 1) { setMessages((prev) => prev.slice(0, -1)); sendPrompt(msg.prompt); }
    else sendPrompt(msg.prompt);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const hasContent = prompt.trim().length > 0;

  return (
    <div className="flex flex-col h-full bg-[#212121] text-[#ececec]">

      {/* Mobile header */}
      <div className="md:hidden flex-shrink-0 flex items-center p-3 border-b border-[#2b2c2f]">
        <button onClick={() => window.dispatchEvent(new Event("open-sidebar"))} className="p-2 hover:bg-[#2f2f2f] rounded-md transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* ── Scrollable messages area ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide">

        {/* Empty state */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 pb-32">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-5 shadow-lg shadow-black/40">
              <svg className="w-7 h-7 text-white/90" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4l8 11V4h3v16h-4L9 9v11H6V4z" />
                <path d="M19 4h-2v2h2V4zM7 20h2v-2H7v2z" opacity="0.5" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold mb-2 text-white">How can I help you today?</h1>
            <p className="text-[#6b6b6b] text-sm max-w-sm">Ask me anything. I'm here to assist.</p>
          </div>
        )}

        {/* Messages — centered column, no alternating rows */}
        {messages.length > 0 && (
          <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-8">
            {messages.map((m, i) => (
              <div key={i} className="space-y-4">

                {/* User bubble — right-aligned pill */}
                <div className="flex justify-end">
                  <div className="max-w-[75%] bg-[#2f2f2f] rounded-2xl rounded-br-sm px-4 py-3 text-[#ececec] text-[15px] leading-7 whitespace-pre-wrap">
                    {m.prompt}
                  </div>
                </div>

                {/* AI response — left-aligned, no bubble */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 mt-0.5 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow">
                    <svg className="w-4 h-4 text-white/90" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 4h4l8 11V4h3v16h-4L9 9v11H6V4z" />
                      <path d="M19 4h-2v2h2V4zM7 20h2v-2H7v2z" opacity="0.5" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="prose prose-invert max-w-none text-[15px]">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p({ children }) { return <p className="text-[#ececec] mb-4 last:mb-0 leading-7">{children}</p>; },
                          strong({ children }) { return <strong className="font-semibold text-white">{children}</strong>; },
                          ul({ children }) { return <ul className="list-disc pl-5 mb-4 space-y-1.5 text-[#ececec]">{children}</ul>; },
                          ol({ children }) { return <ol className="list-decimal pl-5 mb-4 space-y-1.5 text-[#ececec]">{children}</ol>; },
                          li({ children }) { return <li className="text-[#ececec] leading-7">{children}</li>; },
                          h1({ children }) { return <h1 className="text-xl font-semibold text-white mb-3 mt-6">{children}</h1>; },
                          h2({ children }) { return <h2 className="text-lg font-semibold text-white mb-2 mt-5">{children}</h2>; },
                          h3({ children }) { return <h3 className="text-base font-semibold text-white mb-2 mt-4">{children}</h3>; },
                          blockquote({ children }) { return <blockquote className="border-l-2 border-[#4a4a4a] pl-4 italic text-[#9a9a9a] my-4">{children}</blockquote>; },
                          code({ inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || "");
                            if (!inline && match) {
                              return (
                                <div className="my-4 rounded-xl overflow-hidden border border-[#3a3a3a]">
                                  <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] text-xs text-[#6b6b6b]">
                                    <span style={{ fontFamily: GEIST_MONO }}>{match[1]}</span>
                                    <button onClick={() => navigator.clipboard.writeText(String(children))} className="flex items-center gap-1.5 hover:text-[#ececec] transition-colors">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                      Copy
                                    </button>
                                  </div>
                                  <SyntaxHighlighter {...props} style={oneDark} language={match[1]} PreTag="div"
                                    customStyle={{ background: "#0d0d0d", padding: "1rem 1.25rem", margin: 0, fontSize: "13px", lineHeight: "1.6", fontFamily: GEIST_MONO }}>
                                    {String(children).replace(/\n$/, "")}
                                  </SyntaxHighlighter>
                                </div>
                              );
                            }
                            return <code style={{ fontFamily: GEIST_MONO }} className="px-1.5 py-0.5 rounded-md bg-[#2a2a2a] text-[#f97316] text-[13px]" {...props}>{children}</code>;
                          },
                        }}
                      >
                        {m.reply}
                      </ReactMarkdown>
                    </div>

                    {/* Action row */}
                    <div className="flex items-center gap-1 mt-3 -ml-1">
                      <button onClick={() => handleCopy(m.reply, i)} title="Copy"
                        className={`p-1.5 rounded-md transition-colors ${copiedIndex === i ? "text-green-500" : "text-[#4a4a4a] hover:text-[#ececec] hover:bg-[#2f2f2f]"}`}>
                        {copiedIndex === i
                          ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                      </button>
                      <button onClick={() => handleFeedback(i, "good")} title="Good" className={`p-1.5 rounded-md transition-colors ${m.feedback === "good" ? "text-green-500" : "text-[#4a4a4a] hover:text-[#ececec] hover:bg-[#2f2f2f]"}`}>
                        <svg className="w-3.5 h-3.5" fill={m.feedback === "good" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                      </button>
                      <button onClick={() => handleFeedback(i, "bad")} title="Bad" className={`p-1.5 rounded-md transition-colors ${m.feedback === "bad" ? "text-red-500" : "text-[#4a4a4a] hover:text-[#ececec] hover:bg-[#2f2f2f]"}`}>
                        <svg className="w-3.5 h-3.5" fill={m.feedback === "bad" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                      </button>
                      <button onClick={() => handleRegenerate(i)} title="Regenerate" className="p-1.5 rounded-md text-[#4a4a4a] hover:text-[#ececec] hover:bg-[#2f2f2f] transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 mt-0.5 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white/90" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4l8 11V4h3v16h-4L9 9v11H6V4z" />
                    <path d="M19 4h-2v2h2V4zM7 20h2v-2H7v2z" opacity="0.5" />
                  </svg>
                </div>
                <div className="flex items-center gap-1 pt-1.5">
                  <div className="w-1.5 h-1.5 bg-[#6b6b6b] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 bg-[#6b6b6b] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 bg-[#6b6b6b] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}

        {/* Anchor when empty */}
        {messages.length === 0 && <div ref={bottomRef} />}
      </div>

      {/* ── Input area — always pinned to bottom ── */}
      <div className="flex-shrink-0 bg-[#212121] px-4 pb-5 pt-2">
        <div className="w-full max-w-3xl mx-auto">
          <div className="bg-[#2f2f2f] rounded-2xl border border-[#3a3a3a]">

            {/* @ Add context */}
            <div className="px-3 pt-3 pb-1">
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#3a3a3a] hover:bg-[#444] text-[#ececec] text-sm transition-colors">
                <AtSign size={13} className="text-[#8e8ea0]" />
                <span className="text-[13px]">Add context</span>
              </button>
            </div>

            {/* Textarea */}
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

            {/* Bottom bar */}
            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-1">
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#6b6b6b] hover:text-[#ececec] hover:bg-[#3a3a3a] text-[13px] transition-colors">
                  <Paperclip size={13} />
                  <span>Auto</span>
                  <ChevronDown size={12} />
                </button>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#6b6b6b] hover:text-[#ececec] hover:bg-[#3a3a3a] text-[13px] transition-colors">
                  <Globe size={13} />
                  <span>All Sources</span>
                  <ChevronDown size={12} />
                </button>
              </div>

              <button
                onClick={() => sendPrompt()}
                disabled={!hasContent || loading}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  hasContent && !loading
                    ? "bg-[#ef4444] hover:bg-[#dc2626] text-white shadow-md shadow-red-500/25"
                    : "bg-[#3a3a3a] text-[#4a4a4a] cursor-not-allowed"
                }`}
              >
                {loading
                  ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  : <ArrowUp size={15} />
                }
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
import { useState, useEffect, useRef } from "react";
import { getThreadId } from "../utils/thread";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const API_URL = (import.meta as any).env?.VITE_API_URL;

export default function Chat() {
  const [threadId, setThreadId] = useState(getThreadId());
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<{ prompt: string; reply: string; feedback?: 'good' | 'bad' }[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const updateThreadId = () => {
      const newId = localStorage.getItem("threadId");
      if (newId && newId !== threadId) setThreadId(newId);
    };

    window.addEventListener("storage", updateThreadId);
    const interval = setInterval(updateThreadId, 1000);

    return () => {
      window.removeEventListener("storage", updateThreadId);
      clearInterval(interval);
    };
  }, [threadId]);

  useEffect(() => {
    if (!threadId) return;

    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/ai/history?threadId=${threadId}`, {
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setMessages(data))
      .catch(() => { });
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
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ prompt: currentPrompt, threadId }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { prompt: currentPrompt, reply: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { prompt: currentPrompt, reply: "⚠️ Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleFeedback = (index: number, type: 'good' | 'bad') => {
    setMessages(prev => prev.map((msg, i) =>
      i === index ? { ...msg, feedback: msg.feedback === type ? undefined : type } : msg
    ));
  };

  const handleRegenerate = (index: number) => {
    const msg = messages[index];
    if (index === messages.length - 1) {
      setMessages(prev => prev.slice(0, -1)); // Remove last message to simulate regenerate
      sendPrompt(msg.prompt);
    } else {
      sendPrompt(msg.prompt); // Just resend if it's an older message
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-full bg-[#212121] text-[#ececec]">

      {/* MESSAGES AREA - ChatGPT Style */}
      <div className="flex-1 overflow-y-auto">

        {/* Empty State */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-6 shadow-lg shadow-black/40">
              <svg className="w-8 h-8 text-white/90" viewBox="0 0 24 24" fill="currentColor">
                {/* Stylized 'N' Logo */}
                <path d="M6 4h4l8 11V4h3v16h-4L9 9v11H6V4z" />
                <path d="M19 4h-2v2h2V4zM7 20h2v-2H7v2z" opacity="0.5" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold mb-2">How can I help you today?</h1>
            <p className="text-[#8e8ea0] text-sm max-w-md">Ask me anything. I'm here to assist.</p>
          </div>
        )}

        {/* Messages */}
        {messages.map((m, i) => (
          <div key={i}>
            {/* User Message Row */}
            <div className="py-6 bg-[#212121]">
              <div className="max-w-3xl mx-auto px-4 flex gap-4">
                {/* User Avatar */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-medium">
                  U
                </div>
                {/* User Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm mb-1 text-[#ececec]">You</div>
                  <div className="text-[#ececec] whitespace-pre-wrap">{m.prompt}</div>
                </div>
              </div>
            </div>

            {/* AI Message Row */}
            <div className="py-6 bg-[#2f2f2f]">
              <div className="max-w-3xl mx-auto px-4 flex gap-4">
                {/* AI Avatar */}
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white/90" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4l8 11V4h3v16h-4L9 9v11H6V4z" />
                    <path d="M19 4h-2v2h2V4zM7 20h2v-2H7v2z" opacity="0.5" />
                  </svg>
                </div>
                {/* AI Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm mb-1 text-[#ececec]">NEXUS</div>
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p({ children }) {
                          return <p className="text-[#ececec] mb-4 last:mb-0 leading-7">{children}</p>;
                        },
                        strong({ children }) {
                          return <strong className="font-semibold text-white">{children}</strong>;
                        },
                        ul({ children }) {
                          return <ul className="list-disc pl-6 mb-4 space-y-2 text-[#ececec]">{children}</ul>;
                        },
                        ol({ children }) {
                          return <ol className="list-decimal pl-6 mb-4 space-y-2 text-[#ececec]">{children}</ol>;
                        },
                        li({ children }) {
                          return <li className="text-[#ececec] leading-7">{children}</li>;
                        },
                        h1({ children }) {
                          return <h1 className="text-xl font-semibold text-white mb-4 mt-6">{children}</h1>;
                        },
                        h2({ children }) {
                          return <h2 className="text-lg font-semibold text-white mb-3 mt-5">{children}</h2>;
                        },
                        h3({ children }) {
                          return <h3 className="text-base font-semibold text-white mb-2 mt-4">{children}</h3>;
                        },
                        blockquote({ children }) {
                          return <blockquote className="border-l-4 border-[#565869] pl-4 italic text-[#b4b4b4] my-4">{children}</blockquote>;
                        },
                        code({ inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || "");

                          if (!inline && match) {
                            return (
                              <div className="my-4 rounded-lg overflow-hidden bg-black">
                                <div className="flex items-center justify-between px-4 py-2 bg-[#343541] text-xs text-[#d9d9e3]">
                                  <span>{match[1]}</span>
                                  <button
                                    onClick={() => navigator.clipboard.writeText(String(children))}
                                    className="flex items-center gap-1 hover:text-white transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Copy code
                                  </button>
                                </div>
                                <SyntaxHighlighter
                                  {...props}
                                  style={oneDark}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{
                                    background: "#000",
                                    padding: "1rem",
                                    margin: 0,
                                    fontSize: "14px",
                                    lineHeight: "1.5",
                                    fontFamily: '"Söhne Mono", Monaco, "Andale Mono", monospace',
                                  }}
                                >
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              </div>
                            );
                          }

                          return (
                            <code className="px-1 py-0.5 rounded bg-[#3a3a3a] text-[#f97316] text-sm font-mono" {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {m.reply}
                    </ReactMarkdown>
                  </div>

                  {/* Action buttons - ChatGPT style */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleCopy(m.reply, i)}
                      className={`p-1 transition-colors ${copiedIndex === i ? "text-green-500" : "text-[#8e8ea0] hover:text-white"}`}
                      title="Copy"
                    >
                      {copiedIndex === i ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleFeedback(i, 'good')}
                      className={`p-1 transition-colors ${m.feedback === 'good' ? "text-green-500" : "text-[#8e8ea0] hover:text-white"}`}
                      title="Good response"
                    >
                      <svg className="w-4 h-4" fill={m.feedback === 'good' ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleFeedback(i, 'bad')}
                      className={`p-1 transition-colors ${m.feedback === 'bad' ? "text-red-500" : "text-[#8e8ea0] hover:text-white"}`}
                      title="Bad response"
                    >
                      <svg className="w-4 h-4" fill={m.feedback === 'bad' ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleRegenerate(i)}
                      className="p-1 text-[#8e8ea0] hover:text-white transition-colors"
                      title="Regenerate"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Loading State */}
        {loading && (
          <div className="py-6 bg-[#2f2f2f]">
            <div className="max-w-3xl mx-auto px-4 flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white/90" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 4h4l8 11V4h3v16h-4L9 9v11H6V4z" />
                  <path d="M19 4h-2v2h2V4zM7 20h2v-2H7v2z" opacity="0.5" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm mb-1 text-[#ececec]">NEXUS</div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#ececec] rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-[#ececec] rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 bg-[#ececec] rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT AREA - Exact ChatGPT Style */}
      <div className="bg-[#212121] px-4 pb-4 pt-2">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 bg-[#2f2f2f] rounded-3xl border border-[#424242] px-3 py-2">
            {/* Attach Button */}
            <button className="flex-shrink-0 p-2 text-[#8e8ea0] hover:text-white rounded-full hover:bg-[#424242] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Message NEXUS"
              rows={1}
              className="flex-1 bg-transparent py-2 resize-none focus:outline-none text-[#ececec] placeholder-[#8e8ea0] max-h-52 leading-6 text-base"
            />

            {/* Send Button - Circular like ChatGPT */}
            <button
              onClick={() => sendPrompt()}
              disabled={!prompt.trim() || loading}
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${!prompt.trim() || loading
                ? "bg-[#424242] text-[#676767] cursor-not-allowed"
                : "bg-white text-black hover:bg-gray-200"
                }`}
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-[#8e8ea0] mt-3">
            NEXUS can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );
}

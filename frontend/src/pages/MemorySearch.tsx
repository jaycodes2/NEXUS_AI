import { useState, useRef, useEffect } from "react";
import { Search, Brain, ArrowUp, Sparkles, Clock, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_URL = (import.meta as any).env?.VITE_API_URL;

interface MemoryResult {
  question: string;
  answer: string;
  timestamp: Date;
}

const SUGGESTED_QUERIES = [
  "What projects have I been working on?",
  "What bugs or errors did I run into recently?",
  "What technologies did I discuss?",
  "What did I ask about MongoDB?",
  "Summarise my recent conversations",
];

export default function MemorySearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MemoryResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (results.length > 0) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [results]);

  async function search(customQuery?: string) {
    const q = customQuery || query;
    if (!q.trim() || loading) return;

    setLoading(true);
    setError(null);
    if (!customQuery) setQuery("");

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/api/memory/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ question: q }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setResults((prev) => [
        ...prev,
        { question: q, answer: data.answer, timestamp: new Date() },
      ]);
    } catch (err: any) {
      setError(err.message || "Failed to search memory. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); search(); }
  }

  function clearResults() {
    setResults([]);
    setError(null);
    inputRef.current?.focus();
  }

  const hasResults = results.length > 0;

  return (
    <div className="flex flex-col h-full bg-black text-[#ececec]">

      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#1a1a1a] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0d0d0d] border border-[#1f1f1f] flex items-center justify-center">
              <Brain size={16} className="text-white/70" />
            </div>
            <div>
              <h1 className="text-[14px] font-semibold text-white leading-none">Memory Search</h1>
              <p className="text-[11px] text-[#555] mt-0.5">Ask questions about your past conversations</p>
            </div>
          </div>
          {hasResults && (
            <button
              onClick={clearResults}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#555] hover:text-white hover:bg-[#1a1a1a] transition-colors text-xs"
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-3xl mx-auto px-4 py-6">

          {/* Empty state — show when no results yet */}
          {!hasResults && !loading && (
            <div className="flex flex-col items-center text-center pt-12 pb-8">
              {/* Animated brain icon */}
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#0d0d0d] border border-[#1f1f1f] flex items-center justify-center">
                  <Brain size={28} className="text-white/50" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0d0d0d] border border-[#1f1f1f] flex items-center justify-center">
                  <Sparkles size={10} className="text-white/40" />
                </div>
              </div>

              <h2 className="text-lg font-semibold text-white mb-1">Ask your memory</h2>
              <p className="text-[#555] text-sm max-w-sm mb-8">
                Search across all your past conversations using natural language. NEXUS finds relevant context using semantic similarity.
              </p>

              {/* Suggested queries */}
              <div className="w-full max-w-lg space-y-2">
                <p className="text-[11px] text-[#444] uppercase tracking-widest mb-3">Try asking</p>
                {SUGGESTED_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => search(q)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[#2a2a2a] hover:bg-[#111] transition-all text-left group"
                  >
                    <Search size={13} className="text-[#444] group-hover:text-[#888] transition-colors flex-shrink-0" />
                    <span className="text-[13px] text-[#666] group-hover:text-[#aaa] transition-colors">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {hasResults && (
            <div className="space-y-8">
              {results.map((r, i) => (
                <div key={i} className="space-y-4">
                  {/* Question */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] bg-[#111] rounded-2xl rounded-br-sm px-4 py-3 text-[#ececec] text-[14px] border border-[#1a1a1a]">
                      {r.question}
                    </div>
                  </div>

                  {/* Answer */}
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-7 h-7 mt-0.5 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a] flex items-center justify-center">
                      <Brain size={14} className="text-white/60" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="prose prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => (
                              <p className="text-[#d4d4d4] text-[14px] leading-7 mb-3 last:mb-0">{children}</p>
                            ),
                            strong: ({ children }) => (
                              <strong className="text-white font-semibold">{children}</strong>
                            ),
                            em: ({ children }) => (
                              <em className="text-[#d4d4d4] italic">{children}</em>
                            ),
                            ul: ({ children }) => (
                              <ul className="my-2 space-y-1.5 pl-1">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="my-2 space-y-1.5 pl-1 list-none">{children}</ol>
                            ),
                            li: ({ children, ordered, index }: any) => (
                              <li className="flex items-start gap-2.5 text-[#d4d4d4] text-[14px] leading-7">
                                {ordered
                                  ? <span className="flex-shrink-0 w-5 text-[#555] text-sm font-mono mt-0.5">{(index ?? 0) + 1}.</span>
                                  : <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#555] mt-[0.6rem]" />
                                }
                                <span className="flex-1 min-w-0">{children}</span>
                              </li>
                            ),
                            code: ({ inline, children }: any) => (
                              inline
                                ? <code className="px-1.5 py-0.5 rounded text-[12px] text-[#e2e8f0]" style={{ background: "#1e1e1e", border: "1px solid #2a2a2a" }}>{children}</code>
                                : <pre className="my-3 p-4 rounded-xl bg-[#0d0d0d] border border-[#2a2a2a] overflow-x-auto text-[13px] text-[#d4d4d4]"><code>{children}</code></pre>
                            ),
                            pre: ({ children }) => <>{children}</>,
                            blockquote: ({ children }) => (
                              <blockquote className="my-3 pl-4 border-l-2 border-[#333] text-[#888] italic">{children}</blockquote>
                            ),
                            h1: ({ children }) => <h1 className="text-white font-semibold text-lg mt-4 mb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-white font-semibold text-base mt-4 mb-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-white font-semibold text-[14px] mt-3 mb-1">{children}</h3>,
                          }}
                        >
                          {r.answer}
                        </ReactMarkdown>
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center gap-1.5 mt-3">
                        <Clock size={11} className="text-[#333]" />
                        <span className="text-[11px] text-[#333]">
                          {r.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {i < results.length - 1 && <hr className="border-[#1a1a1a]" />}
                </div>
              ))}

              {/* Loading state */}
              {loading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 mt-0.5 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a] flex items-center justify-center">
                    <Brain size={14} className="text-white/60" />
                  </div>
                  <div className="flex items-center gap-1 pt-2">
                    <div className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce [animation-delay:0.15s]" />
                    <div className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}

          {/* Loading on empty state */}
          {!hasResults && loading && (
            <div className="flex flex-col items-center pt-16 gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#0d0d0d] border border-[#1f1f1f] flex items-center justify-center">
                <Brain size={20} className="text-white/50 animate-pulse" />
              </div>
              <p className="text-[#555] text-sm">Searching your memory...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 text-[13px]">
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>

      {/* Search input */}
      <div className="flex-shrink-0 border-t border-[#1a1a1a] bg-black px-4 pb-5 pt-3">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#0b0b0b] rounded-2xl border border-[#1a1a1a] flex items-end gap-2 px-4 py-3">
            <Search size={15} className="text-[#444] flex-shrink-0 mb-0.5" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about your past conversations..."
              disabled={loading}
              className="flex-1 bg-transparent text-[#ececec] placeholder-[#3a3a3a] text-[14px] focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={() => search()}
              disabled={!query.trim() || loading}
              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                query.trim() && !loading
                  ? "bg-white text-black hover:bg-[#e5e5e5]"
                  : "bg-[#1a1a1a] text-[#4a4a4a]"
              }`}
            >
              <ArrowUp size={14} />
            </button>
          </div>
          <p className="text-center text-[11px] text-[#2a2a2a] mt-2">
            Searches across all your past conversations using semantic similarity
          </p>
        </div>
      </div>
    </div>
  );
}

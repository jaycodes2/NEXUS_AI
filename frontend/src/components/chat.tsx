import React, { useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import { getThreadId } from "../utils/thread";

const API_URL = (import.meta as any).env?.VITE_API_URL;

type Message = { prompt: string; reply: string };

export default function Chat() {
  const [threadId, setThreadId] = useState<string | null>(getThreadId());
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // listen for threadId changes from Sidebar / storage
  useEffect(() => {
    function updateThreadId() {
      const newId = localStorage.getItem("threadId");
      if (newId && newId !== threadId) setThreadId(newId);
    }
    window.addEventListener("storage", updateThreadId);
    return () => window.removeEventListener("storage", updateThreadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  // load history when threadId changes
  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/ai/history?threadId=${threadId}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (!res.ok) throw new Error("Failed to fetch history");
        const data = await res.json();
        setMessages(data || []);
      } catch {
        setMessages([]);
      }
    })();
  }, [threadId, token]);

  // scroll to bottom on messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendPrompt() {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ prompt, threadId }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { prompt, reply: data.reply }]);
      setPrompt("");
    } catch (err) {
      console.error("sendPrompt error", err);
    } finally {
      setLoading(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  };

  return (
    <div className="h-full flex relative bg-white dark:bg-gray-900">
      {/* Mobile overlay + drawer */}
      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full w-64 z-50 md:hidden">
            <Sidebar closeSidebar={() => setMobileSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar />
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            {/* Hamburger (mobile) */}
            <button
              className="md:hidden p-2 rounded-md bg-gray-100 dark:bg-gray-800"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open menu"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h1>
            </div>
          </div>

          <div className="hidden sm:block" /> {/* spacer to keep header height balanced */}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-6 scrollbar-hide bg-white dark:bg-gray-900">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Start a conversation</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Ask me anything and I'll help you find the answers you're looking for.
                </p>
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className="space-y-6">
                {/* User */}
                <div className="flex justify-end">
                  <div className="flex items-start space-x-3 max-w-full sm:max-w-[80%]">
                    <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-sm break-words">
                      <p className="text-sm leading-relaxed">{m.prompt}</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-white">You</span>
                    </div>
                  </div>
                </div>

                {/* AI */}
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-full sm:max-w-[80%]">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-white">AI</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-lg shadow-sm break-words">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.reply}</p>
                      <div className="flex items-center space-x-2 mt-3 pt-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">AI Assistant</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-full sm:max-w-[80%]">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-white">AI</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-lg shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="bg-white dark:bg-gray-900 px-4 sm:px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message AI Assistant..."
                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                rows={1}
                style={{ minHeight: 48, maxHeight: 200 }}
              />
              <button
                onClick={sendPrompt}
                disabled={!prompt.trim() || loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center"
              >
                Send
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {["How does this work?", "Show me examples", "Explain AI features", "Help with setup"].map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600 shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

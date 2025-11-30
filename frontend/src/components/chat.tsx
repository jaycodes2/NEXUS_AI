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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Fix threadId sync
  useEffect(() => {
    function updateThreadId() {
      const newId = localStorage.getItem("threadId");
      setThreadId(newId);
    }
    
    window.addEventListener("storage", updateThreadId);
    window.addEventListener("threadChanged", updateThreadId);
    
    return () => {
      window.removeEventListener("storage", updateThreadId);
      window.removeEventListener("threadChanged", updateThreadId);
    };
  }, []);

  // Load history when threadId changes
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

  // Scroll to bottom on messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [prompt]);

  async function sendPrompt() {
    if (!prompt.trim() || loading) return;
    
    setLoading(true);
    const currentPrompt = prompt;
    setPrompt("");

    try {
      const res = await fetch(`${API_URL}/api/ai/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ prompt: currentPrompt, threadId }),
      });
      
      if (!res.ok) throw new Error("Request failed");
      
      const data = await res.json();
      setMessages((prev) => [...prev, { prompt: currentPrompt, reply: data.reply }]);
    } catch (err) {
      console.error("sendPrompt error", err);
      // Add error message to chat
      setMessages((prev) => [...prev, { 
        prompt: currentPrompt, 
        reply: "Sorry, I encountered an error. Please try again." 
      }]);
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

  const quickPrompt = (text: string) => {
    setPrompt(text);
    // Focus and move cursor to end
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(text.length, text.length);
    }, 0);
  };

  return (
    <div className="h-screen flex bg-white dark:bg-gray-900 overflow-hidden">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw]">
            <Sidebar closeSidebar={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <h1 className="font-semibold text-gray-900 dark:text-white">
                {threadId ? "AI Assistant" : "New Chat"}
              </h1>
            </div>
          </div>

          {threadId && (
            <button
              onClick={() => {
                localStorage.removeItem("threadId");
                setThreadId(null);
                setMessages([]);
                window.dispatchEvent(new Event("threadChanged"));
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="New chat"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </header>

        {/* Messages container */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center px-4">
                <div className="text-center max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Start a conversation
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Ask me anything and I'll help you find answers.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      "How does this work?",
                      "Show me examples", 
                      "Explain AI features",
                      "Help with setup"
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => quickPrompt(suggestion)}
                        className="p-3 text-left text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div key={index} className="space-y-4">
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="max-w-[85%] lg:max-w-[70%]">
                        <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-br-md">
                          <p className="text-sm leading-relaxed">{message.prompt}</p>
                        </div>
                      </div>
                    </div>

                    {/* AI response */}
                    <div className="flex justify-start">
                      <div className="max-w-[85%] lg:max-w-[70%]">
                        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
                          <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                            {message.reply}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] lg:max-w-[70%]">
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
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
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Quick prompts */}
              {messages.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "Explain simply",
                    "Give examples", 
                    "Step by step",
                    "More details"
                  ].map((quickAction) => (
                    <button
                      key={quickAction}
                      onClick={() => quickPrompt(quickAction)}
                      className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {quickAction}
                    </button>
                  ))}
                </div>
              )}

              {/* Input form */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message AI Assistant..."
                    rows={1}
                    className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base transition-all"
                    style={{ minHeight: '52px', maxHeight: '120px' }}
                  />
                </div>
                
                <button
                  onClick={sendPrompt}
                  disabled={!prompt.trim() || loading}
                  className="px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-2xl font-medium transition-colors flex items-center justify-center min-w-[60px]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
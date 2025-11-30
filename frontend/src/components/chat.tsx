import { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import { getThreadId } from "../utils/thread";

const API_URL = (import.meta as any).env?.VITE_API_URL;

export default function Chat() {
  const [threadId, setThreadId] = useState(getThreadId());
  const token = localStorage.getItem("token");

  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<{ prompt: string; reply: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function updateThreadId() {
      const newId = localStorage.getItem("threadId");
      if (newId && newId !== threadId) setThreadId(newId);
    }
    window.addEventListener("storage", updateThreadId);
    return () => window.removeEventListener("storage", updateThreadId);
  }, [threadId]);

  useEffect(() => {
    if (!threadId) return;
    fetch(`${API_URL}/api/ai/history?threadId=${threadId}`, {
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    })
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch(() => {});
  }, [threadId, token]);

  async function sendPrompt() {
    if (!prompt.trim()) return;
    setLoading(true);
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
    setLoading(false);
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full flex bg-white dark:bg-gray-900">

      {/* SIDEBAR (hidden on mobile) */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col">

        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-white dark:bg-gray-900">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h1>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 sm:px-6 py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Start a conversation</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">Ask me anything.</p>
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className="space-y-6">
                <div className="flex justify-end">
                  <div className="flex items-start space-x-3 max-w-[80%]">
                    <div className="flex-1" />
                    <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-sm">
                      <p className="text-sm">{m.prompt}</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-white">You</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-[80%]">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-white">AI</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-lg shadow-sm">
                      <p className="text-sm whitespace-pre-wrap text-gray-900 dark:text-gray-100">{m.reply}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-[80%]">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
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

        {/* Input */}
        <div className="bg-white dark:bg-gray-900 px-4 sm:px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-4">
              <div className="flex-1 relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Message AI Assistant..."
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 resize-none"
                />
              </div>
              <button
                onClick={sendPrompt}
                disabled={!prompt.trim() || loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
              >
                Send
              </button>
            </div>
          </div>
        </div>

      </div> 
    </div>   
  );
}

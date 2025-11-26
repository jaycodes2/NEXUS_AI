import { useState, useEffect, useRef } from "react";
import { getThreadId } from "../utils/thread";

const API_URL = (import.meta as any).env?.VITE_API_URL;

export default function Chat() {
  const threadId = getThreadId();
  const token = localStorage.getItem("token");

  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<{ prompt: string; reply: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch(`${API_URL}api/ai/history?threadId=${threadId}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    })
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(() => {});
  }, [threadId, token]);

  async function sendPrompt() {
    if (!prompt.trim()) return;
    setLoading(true);

    const res = await fetch(`${API_URL}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ prompt, threadId }),
    });

    const data = await res.json();
    setMessages(prev => [...prev, { prompt, reply: data.reply }]);
    setPrompt("");
    setLoading(false);
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h1>
          </div>
        </div>
      </div>

      {/* Messages Container - Scrollbar hidden */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 sm:px-6 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Start a conversation</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                  Ask me anything and I'll help you find the answers you're looking for.
                </p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className="space-y-6">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="flex items-start space-x-3 max-w-[80%]">
                  <div className="flex-1"></div>
                  <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-sm">
                    <p className="text-sm leading-relaxed">{m.prompt}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-white">You</span>
                  </div>
                </div>
              </div>

              {/* AI Message */}
              <div className="flex justify-start">
                <div className="flex items-start space-x-3 max-w-[80%]">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-white">AI</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-lg shadow-sm">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.reply}</p>
                    <div className="flex items-center space-x-2 mt-3 pt-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">AI Assistant</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-[80%]">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-white">AI</span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-lg shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-900 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message AI Assistant..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none pr-12 transition-all duration-200"
                rows={1}
                style={{ minHeight: '69px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={sendPrompt}
              disabled={!prompt.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <span>Send</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Quick Suggestions */}
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {['How does this work?', 'Show me examples', 'Explain AI features', 'Help with setup'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setPrompt(suggestion)}
                className="px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600 shadow-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getThreadId, newThread } from "../utils/thread";

const API_URL = (import.meta as any).env?.VITE_API_URL;

type Props = {
  closeSidebar?: () => void;
};

type Thread = {
  threadId: string;
  name: string;
  createdAt: string;
};

export default function Sidebar({ closeSidebar }: Props) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const activeThread = getThreadId();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const navigate = useNavigate();

  async function loadThreads() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/threads`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!res.ok) throw new Error("Failed to load threads");
      const data = await res.json();
      setThreads(data || []);
    } catch (err) {
      console.error("loadThreads error", err);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadThreads();
    
    // Listen for thread updates
    const handleThreadUpdate = () => {
      loadThreads();
    };
    
    window.addEventListener("threadChanged", handleThreadUpdate);
    return () => {
      window.removeEventListener("threadChanged", handleThreadUpdate);
    };
  }, []);

  async function deleteThread(threadId: string) {
    if (!window.confirm("Are you sure you want to delete this chat?")) return;

    try {
      await fetch(`${API_URL}/api/ai/threads/${threadId}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (threadId === activeThread) {
        const newId = newThread();
        localStorage.setItem("threadId", newId);
        window.dispatchEvent(new Event("threadChanged"));
      }

      await loadThreads();
      setMenuOpen(null);
    } catch (err) {
      console.error("deleteThread error", err);
    }
  }

  function handleNewChat() {
    const id = newThread();
    localStorage.setItem("threadId", id);
    window.dispatchEvent(new Event("threadChanged"));
    navigate("/chat");
    if (closeSidebar) closeSidebar();
  }

  function switchThread(threadId: string) {
    localStorage.setItem("threadId", threadId);
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("threadChanged"));
    navigate("/chat");
    if (closeSidebar) closeSidebar();
  }

  function logout() {
    localStorage.clear();
    window.location.href = "/";
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const formatThreadName = (thread: Thread) => {
    if (thread.name && thread.name !== "New Chat") {
      return thread.name.length > 30 ? thread.name.substring(0, 30) + "..." : thread.name;
    }
    
    // Fallback to date or generic name
    if (thread.createdAt) {
      return new Date(thread.createdAt).toLocaleDateString();
    }
    
    return "New Chat";
  };

  return (
    <div className="w-64 bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/30 flex flex-col h-full text-white">
      {/* Mobile top bar (shows only in drawer) */}
      {closeSidebar && (
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg border border-white/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold">Chat</h1>
              <p className="text-xs text-gray-400">Conversations</p>
            </div>
          </div>

          <button 
            onClick={closeSidebar} 
            aria-label="Close menu" 
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header (desktop) */}
      <div className={`${closeSidebar ? 'hidden md:block' : ''} p-6 border-b border-gray-700/30`}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-white/10 rounded-lg border border-white/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold">Chat</h1>
            <p className="text-xs text-gray-400">Conversations</p>
          </div>
        </div>

        <button
          onClick={handleNewChat}
          className="w-full py-3 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm rounded-lg transition min-h-[44px] flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1" ref={menuRef}>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No conversations yet
          </div>
        ) : (
          threads.map((t) => (
            <div 
              key={t.threadId} 
              className={`group relative flex items-center justify-between p-3 rounded-lg border transition cursor-pointer ${
                t.threadId === activeThread 
                  ? "bg-blue-500/20 border-blue-500/30 text-white" 
                  : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10 hover:text-white"
              }`}
            >
              <div 
                onClick={() => switchThread(t.threadId)} 
                className="flex-1 overflow-hidden min-w-0"
              >
                <span className="text-sm truncate block">
                  {formatThreadName(t)}
                </span>
                {t.createdAt && (
                  <span className="text-xs text-gray-400 truncate block mt-1">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setMenuOpen(menuOpen === t.threadId ? null : t.threadId); 
                }}
                className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-white transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                aria-label="Thread menu"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>

              {menuOpen === t.threadId && (
                <div className="absolute right-0 top-12 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-20 min-w-[120px]">
                  <button 
                    onClick={() => deleteThread(t.threadId)} 
                    className="w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700/30 space-y-2">
        <Link 
          to="/contact" 
          className="flex items-center px-3 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition min-h-[44px]"
          onClick={closeSidebar}
        >
          Contact Support
        </Link>
        <button 
          onClick={logout} 
          className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 rounded-lg transition flex items-center justify-center gap-2 min-h-[44px]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}
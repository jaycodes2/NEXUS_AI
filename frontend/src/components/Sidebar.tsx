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
  const menuRef = useRef<HTMLDivElement>(null);

  const activeThread = getThreadId();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const navigate = useNavigate();

  async function loadThreads() {
    try {
      const res = await fetch(`${API_URL}/api/ai/threads`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (res.ok) {
        const data = await res.json();
        setThreads(data || []);
      }
    } catch (err) {
      console.error("Failed to load threads", err);
      setThreads([]);
    }
  }

  useEffect(() => {
    loadThreads();
    window.addEventListener("threadChanged", loadThreads);
    return () => window.removeEventListener("threadChanged", loadThreads);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNewChat = () => {
    const id = newThread();
    localStorage.setItem("threadId", id);
    window.dispatchEvent(new Event("threadChanged"));
    navigate("/chat");
    closeSidebar?.();
  };

  const switchThread = (threadId: string) => {
    localStorage.setItem("threadId", threadId);
    window.dispatchEvent(new Event("threadChanged"));
    navigate("/chat");
    closeSidebar?.();
  };

  const deleteThread = async (threadId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!window.confirm("Delete this conversation?")) return;

    try {
      await fetch(`${API_URL}/api/ai/threads/${threadId}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (threadId === activeThread) {
        handleNewChat();
      }

      loadThreads();
      setMenuOpen(null);
    } catch (err) {
      console.error("Failed to delete thread", err);
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const formatThreadName = (thread: Thread) => {
    return thread.name && thread.name !== "New Chat" 
      ? thread.name 
      : "New Chat";
  };

  return (
    <div className="w-80 h-full bg-gray-900 text-white flex flex-col border-r border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <button
          onClick={handleNewChat}
          className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Threads list */}
      <div className="flex-1 overflow-y-auto p-2" ref={menuRef}>
        {threads.map((thread) => (
          <div
            key={thread.threadId}
            className={`relative p-3 rounded-lg mb-1 cursor-pointer transition-colors ${
              thread.threadId === activeThread
                ? "bg-blue-500/20 text-white"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => switchThread(thread.threadId)}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm truncate flex-1">
                {formatThreadName(thread)}
              </span>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(menuOpen === thread.threadId ? null : thread.threadId);
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
            </div>

            {/* Dropdown menu */}
            {menuOpen === thread.threadId && (
              <div className="absolute right-2 top-12 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-10">
                <button
                  onClick={(e) => deleteThread(thread.threadId, e)}
                  className="w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <Link
          to="/contact"
          className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          onClick={closeSidebar}
        >
          Contact Support
        </Link>
        <button
          onClick={logout}
          className="w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
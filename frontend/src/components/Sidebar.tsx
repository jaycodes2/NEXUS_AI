import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getThreadId, newThread } from "../utils/thread";

const API_URL = (import.meta as any).env?.VITE_API_URL;


export default function Sidebar() {
  const [threads, setThreads] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const activeThread = getThreadId();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  async function loadThreads() {
    try {
      const res = await fetch(`${API_URL}/threads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setThreads(data);
    } catch (error) {
      console.error("Failed to load threads:", error);
    }
  }

  useEffect(() => {
    loadThreads();
  }, []);

  async function deleteThread(threadId: string) {
    if (!window.confirm("Are you sure you want to delete this chat?")) return;

    try {
      await fetch(`${API_URL}/threads/${threadId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (threadId === activeThread) {
        newThread();
      }

      await loadThreads();
      setMenuOpen(null);
    } catch (error) {
      console.error("Failed to delete thread:", error);
    }
  }

  function handleNewChat() {
    newThread();
    window.location.reload();
  }

  function switchThread(threadId: string) {
    localStorage.setItem("threadId", threadId);
    window.location.reload();
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("threadId");
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

  return (
    <div className="w-64 bg-gray-900/80 backdrop-blur-xl border-r border-gray-700/30 flex flex-col h-full">

      {/* Header */}
      <div className="p-6 border-b border-gray-700/30">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-white/10 rounded-lg border border-white/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Chat</h1>
            <p className="text-xs text-gray-400">Conversations</p>
          </div>
        </div>

        <button
          onClick={handleNewChat}
          className="w-full py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm rounded-lg transition"
        >
          + New Chat
        </button>
      </div>

      {/* Threads */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1" ref={menuRef}>
        {threads.map((t) => (
          <div
            key={t.threadId}
            className={`group relative flex items-center justify-between p-2 rounded-lg border transition cursor-pointer
              ${t.threadId === activeThread
                ? "bg-blue-500/20 border-blue-500/30 text-white"
                : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10 hover:text-white"}`}
          >
            <div onClick={() => switchThread(t.threadId)} className="flex-1 overflow-hidden">
              <span className="text-sm truncate">{t.name || "New Chat"}</span>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === t.threadId ? null : t.threadId); }}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition"
            >
              ⋮
            </button>

            {menuOpen === t.threadId && (
              <div className="absolute right-0 top-8 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-20">
                <button
                  onClick={() => deleteThread(t.threadId)}
                  className="w-full px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700/30 space-y-2">

        {/* ✅ FIXED SYSTEM MONITOR BUTTON */}
        <button
          onClick={() => navigate("/system-logs")}
          className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition"
        >
          System Monitor
        </button>

        <Link
          to="/contact"
          className="flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition"
        >
          Contact
        </Link>

        <button
          onClick={logout}
          className="w-full py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 rounded-lg transition"
        >
          Logout
        </button>
      </div>

    </div>
  );
}

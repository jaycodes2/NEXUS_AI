import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getThreadId, newThread } from "../utils/thread";

const API_URL = (import.meta as any).env?.VITE_API_URL;

type Props = {
  closeSidebar?: () => void;
};

export default function Sidebar({ closeSidebar }: Props) {
  const [threads, setThreads] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const activeThread = getThreadId();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const navigate = useNavigate();

  async function loadThreads() {
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
    }
  }

  useEffect(() => {
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function deleteThread(threadId: string) {
    if (!window.confirm("Are you sure you want to delete this chat?")) return;

    try {
      await fetch(`${API_URL}/api/ai/threads/${threadId}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (threadId === activeThread) {
        newThread();
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
    window.dispatchEvent(new Event("storage"));
    navigate("/chat");
    if (closeSidebar) closeSidebar();
  }

  function switchThread(threadId: string) {
    localStorage.setItem("threadId", threadId);
    window.dispatchEvent(new Event("storage"));
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

  return (
    <div className="w-64 bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/30 flex flex-col h-full text-white">
      {/* Mobile top bar (shows only in drawer) */}
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

        <button onClick={() => (closeSidebar ? closeSidebar() : null)} aria-label="Close menu" className="p-2">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Header (desktop) */}
      <div className="hidden md:block p-6 border-b border-gray-700/30">
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
          className="w-full py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm rounded-lg transition"
        >
          + New Chat
        </button>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2" ref={menuRef}>
        {threads.map((t) => (
          <div key={t.threadId} className={`group relative flex items-center justify-between p-2 rounded-lg border transition cursor-pointer ${t.threadId === activeThread ? "bg-blue-500/20 border-blue-500/30 text-white" : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10 hover:text-white"}`}>
            <div onClick={() => switchThread(t.threadId)} className="flex-1 overflow-hidden">
              <span className="text-sm truncate">{t.name || "New Chat"}</span>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === t.threadId ? null : t.threadId); }}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition"
              aria-label="Thread menu"
            >
              ⋮
            </button>

            {menuOpen === t.threadId && (
              <div className="absolute right-0 top-8 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-20">
                <button onClick={() => deleteThread(t.threadId)} className="w-full px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10">
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700/30 space-y-2">
        <Link to="/contact" className="flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition">
          Contact
        </Link>
        <button onClick={logout} className="w-full py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 rounded-lg transition">
          Logout
        </button>
      </div>
    </div>
  );
}

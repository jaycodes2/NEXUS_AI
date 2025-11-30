import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getThreadId, newThread } from "../utils/thread";

const API_URL = (import.meta as any).env?.VITE_API_URL;

export default function Sidebar() {
  const [threads, setThreads] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const activeThread = getThreadId();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  async function loadThreads() {
    try {
      const res = await fetch(`${API_URL}/api/ai/threads`, {
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
      await fetch(`${API_URL}/api/ai/threads/${threadId}`, {
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
    const id = newThread();
    localStorage.setItem("threadId", id);
    window.dispatchEvent(new Event("storage"));
    navigate("/chat");
  }

  function switchThread(threadId: string) {
    localStorage.setItem("threadId", threadId);
    window.dispatchEvent(new Event("storage"));
    navigate("/chat");
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
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-gray-900/80 backdrop-blur-xl border-r border-gray-700/30 
        flex flex-col transition-all duration-300 ease-in-out z-40
        ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'}
      `}>
        
        {/* Sidebar Content */}
        <div className={`${sidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'} transition-all duration-300 overflow-hidden`}>
          
          <div className="p-6 border-b border-gray-700/30">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-lg font-semibold text-white">Chat</h1>
                <p className="text-xs text-gray-400">Conversations</p>
              </div>
              {/* Close button inside sidebar */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 text-gray-400 hover:text-white transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <button
              onClick={handleNewChat}
              className="w-full py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm rounded-lg transition"
            >
              + New Chat
            </button>
          </div>

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

          <div className="p-4 border-t border-gray-700/30 space-y-2">
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
      </div>

      {/* Main content area - adjust margin based on sidebar state */}
      <div className={`
        min-h-screen transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}
      `}>
        {/* Your main app content will go here */}
      </div>
    </>
  );
}
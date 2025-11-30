import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getThreadId, newThread } from "../utils/thread";

const API_URL = (import.meta as any).env?.VITE_API_URL;

export default function Sidebar() {
  const [threads, setThreads] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

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
    setSidebarOpen(false);
  }

  function switchThread(threadId: string) {
    localStorage.setItem("threadId", threadId);
    window.dispatchEvent(new Event("storage"));
    navigate("/chat");
    setSidebarOpen(false);
  }

  function logout() {
    localStorage.clear();
    window.location.href = "/";
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md border border-gray-600"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`
          fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-700 
          z-50 transition-transform duration-300 ease-in-out
          flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-white">Chat</h1>
            <p className="text-xs text-gray-400">Conversations</p>
          </div>

          <button
            onClick={handleNewChat}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            + New Chat
          </button>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2" ref={menuRef}>
          {threads.map((t) => (
            <div
              key={t.threadId}
              className={`relative flex items-center justify-between p-3 rounded-lg cursor-pointer group
                ${t.threadId === activeThread
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
              onClick={() => switchThread(t.threadId)}
            >
              <div className="flex-1 overflow-hidden">
                <span className="text-sm truncate">{t.name || "New Chat"}</span>
              </div>

              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setMenuOpen(menuOpen === t.threadId ? null : t.threadId); 
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-opacity"
              >
                ⋮
              </button>

              {menuOpen === t.threadId && (
                <div className="absolute right-0 top-12 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteThread(t.threadId);
                    }}
                    className="w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          <Link
            to="/contact"
            onClick={() => setSidebarOpen(false)}
            className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            Contact
          </Link>

          <button
            onClick={logout}
            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getThreadId, newThread } from "../utils/thread";
// Added only the necessary component imports
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sidebar as ShadcnSidebar } from "@/components/ui/sidebar"
import { Menu, Plus, MessageSquare, LogOut, Mail } from "lucide-react";



const API_URL = (import.meta as any).env?.VITE_API_URL;

interface SidebarProps {
  className?: string;
  isMobile?: boolean; // If true, forces expanded view and specific mobile styles
  onClose?: () => void;
}

export default function SidebarContent({ className, isMobile, onClose }: SidebarProps) {
  const [threads, setThreads] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [isThreadsOpen, setIsThreadsOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const activeThread = getThreadId();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Force expanded state on mobile
  const effectiveCollapsed = isMobile ? false : isCollapsed;

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
        if (isMobile && onClose) onClose();
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
    if (isMobile && onClose) onClose();
  }

  function switchThread(threadId: string) {
    localStorage.setItem("threadId", threadId);
    window.dispatchEvent(new Event("storage"));
    navigate("/chat");
    if (isMobile && onClose) onClose();
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
    <div className={`${effectiveCollapsed ? "w-20" : "w-64"} ${isMobile ? "bg-[#0d0d0e] z-[100] border-r border-gray-800 h-screen" : "bg-gray-900/80 backdrop-blur-xl border-r border-gray-700/30 h-full"} flex flex-col transition-all duration-300 relative ${className || ""}`}>
      <div className="p-4 border-b border-gray-700/30">
        <div className={`flex items-center ${effectiveCollapsed ? "justify-center" : "space-x-4"} mb-6`}>
          {/* Mobile does not show the collapse toggle here; it's handled by parent overlay or strictly expanded */}
          {!isMobile && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-400 hover:text-white transition p-1 hover:bg-white/10 rounded"
            >
              <Menu size={20} />
            </button>
          )}

          {!effectiveCollapsed && (
            <div>
              <h1 className="text-lg font-semibold text-white">Chat</h1>
              <p className="text-xs text-gray-400">Conversations</p>
            </div>
          )}
        </div>

        <button
          onClick={handleNewChat}
          className={`flex items-center justify-center ${effectiveCollapsed ? "w-10 h-10 p-0" : "w-full py-2.5 px-3 space-x-2"} bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm rounded-lg transition overflow-hidden`}
        >
          <Plus size={18} />
          {!effectiveCollapsed && <span>New Chat</span>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1" ref={menuRef}>
        {/* --- COLLAPSIBLE START --- */}
        {effectiveCollapsed ? (
          <div className="space-y-2 flex flex-col items-center">
            {threads.map((t) => (
              <div
                key={t.threadId}
                onClick={() => switchThread(t.threadId)}
                className={` w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer transition
                    ${t.threadId === activeThread
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-gray-500 hover:text-white hover:bg-white/10"}`}
                title={t.name || "New Chat"}
              >
                <MessageSquare size={18} />
              </div>
            ))}
          </div>
        ) : (
          <Collapsible open={isThreadsOpen} onOpenChange={setIsThreadsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-white transition">
              Recent Threads
              <span>{isThreadsOpen ? "−" : "+"}</span>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-1">
              {threads.map((t) => (
                <div
                  key={t.threadId}
                  className={`group relative flex items-center justify-between p-2 rounded-lg border transition cursor-pointer
                  ${t.threadId === activeThread
                      ? "bg-blue-500/20 border-blue-500/30 text-white"
                      : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10 hover:text-white"}`}
                >
                  <div onClick={() => switchThread(t.threadId)} className="flex-1 overflow-hidden flex items-center space-x-2">
                    <MessageSquare size={14} className="opacity-70" />
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
            </CollapsibleContent>
          </Collapsible>
        )}
        {/* --- COLLAPSIBLE END --- */}
      </div>

      <div className={`flex-shrink-0 p-4 border-t border-gray-700/30 space-y-2 ${effectiveCollapsed ? "flex flex-col items-center" : ""}`}>
        <Link
          to="/contact"
          className={`flex items-center ${effectiveCollapsed ? "justify-center w-10 h-10" : "px-3 py-2 space-x-3"} text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition`}
          title="Contact"
        >
          <Mail size={18} />
          {!effectiveCollapsed && <span>Contact</span>}
        </Link>
        <button
          onClick={logout}
          className={`flex items-center ${effectiveCollapsed ? "justify-center w-10 h-10" : "w-full py-2 space-x-2 justify-center"} bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 rounded-lg transition`}
          title="Logout"
        >
          <LogOut size={18} />
          {!effectiveCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
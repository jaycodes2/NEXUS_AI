import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getThreadId, newThread } from "../utils/thread";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  MoreHorizontal,
  Trash2,
  Mail,
  LogOut,
  Plus,
  Search,
  Download,
  Brain,
} from "lucide-react";
import { fetchAndExport } from "../utils/useExport";

const API_URL = (import.meta as any).env?.VITE_API_URL;

interface SidebarProps {
  className?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ className, isMobile, onClose }: SidebarProps) {
  const [threads, setThreads] = useState<any[]>([]);
  const [search, setSearch] = useState("");

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
    } catch (err) {
      console.error("Failed to load threads:", err);
    }
  }

  useEffect(() => { loadThreads(); }, []);

  // Reload when AI tool deletes a thread
  useEffect(() => {
    const handler = () => loadThreads();
    window.addEventListener("thread-deleted", handler);
    return () => window.removeEventListener("thread-deleted", handler);
  }, []);

  async function deleteThread(threadId: string) {
    if (!window.confirm("Delete this chat?")) return;
    try {
      await fetch(`${API_URL}/api/ai/threads/${threadId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (threadId === activeThread) { newThread(); if (isMobile && onClose) onClose(); }
      await loadThreads();
    } catch (err) {
      console.error("Failed to delete:", err);
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

  const filtered = threads.filter((t) =>
    (t.name || "New Chat").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className={`
        flex flex-col h-full w-[248px] shrink-0
        bg-[#0a0a0a] border-r border-[#1f1f1f] text-sm text-[#a1a1aa]
        ${className ?? ""}
      `}
    >
      {/* App Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-[#1f1f1f]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1d4ed8]">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4l8 11V4h3v16h-4L9 9v11H6V4z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-[#fafafa] truncate leading-tight">NEXUS</div>
          <div className="text-[11px] text-[#71717a] leading-tight">v1.0.0</div>
        </div>
        <button
          onClick={handleNewChat}
          className="flex items-center justify-center h-6 w-6 rounded-md text-[#71717a] hover:text-[#fafafa] hover:bg-[#1f1f1f] transition-colors"
          title="New Chat"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-2 rounded-md border border-[#27272a] bg-[#111111] px-3 py-1.5">
          <Search size={13} className="shrink-0 text-[#52525b]" />
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-[#a1a1aa] placeholder-[#52525b] focus:outline-none"
          />
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 scrollbar-hide">
        <div className="px-2 py-1.5 text-[11px] font-medium text-[#52525b] uppercase tracking-wider">
          Recent
        </div>

        {filtered.length === 0 && (
          <p className="px-2 py-4 text-xs text-[#3f3f46] text-center">
            {search ? "No results found" : "No conversations yet"}
          </p>
        )}

        {filtered.map((t) => {
          const isActive = t.threadId === activeThread;
          return (
            <div
              key={t.threadId}
              className={`
                group relative flex items-center rounded-md transition-colors mb-0.5
                ${isActive
                  ? "bg-[#1f1f1f] text-[#fafafa]"
                  : "text-[#a1a1aa] hover:bg-[#141414] hover:text-[#fafafa]"}
              `}
            >
              <button
                onClick={() => switchThread(t.threadId)}
                className="flex flex-1 items-center gap-2 overflow-hidden px-2 py-1.5 text-left"
              >
                <MessageSquare size={13} className="shrink-0 opacity-60" />
                <span className="truncate text-[13px]">{t.name || "New Chat"}</span>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="
                      mr-1 flex h-5 w-5 shrink-0 items-center justify-center rounded
                      opacity-0 group-hover:opacity-100 focus:opacity-100
                      text-[#52525b] hover:text-[#fafafa] transition-all
                    "
                  >
                    <MoreHorizontal size={13} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer text-xs"
                    onClick={() => fetchAndExport(t.threadId, t.name || "conversation", "markdown")}
                  >
                    <Download size={12} />
                    Export as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer text-xs"
                    onClick={() => fetchAndExport(t.threadId, t.name || "conversation", "pdf")}
                  >
                    <Download size={12} />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-400 focus:text-red-400 focus:bg-red-500/10 gap-2 cursor-pointer text-xs"
                    onClick={() => deleteThread(t.threadId)}
                  >
                    <Trash2 size={12} />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-[#1f1f1f] px-2 py-2 space-y-0.5">
        <Link
          to="/memory"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-[#71717a] hover:text-[#fafafa] hover:bg-[#141414] transition-colors"
        >
          <Brain size={14} className="shrink-0" />
          Memory Search
        </Link>
        <Link
          to="/contact"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-[#71717a] hover:text-[#fafafa] hover:bg-[#141414] transition-colors"
        >
          <Mail size={14} className="shrink-0" />
          Contact
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-[#71717a] hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={14} className="shrink-0" />
          Log out
        </button>
      </div>
    </div>
  );
}
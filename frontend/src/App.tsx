import { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Chat from "./components/chat";
import Login from "./components/Login";
import Welcome from "./components/Welcome";
import Documentation from "./pages/Documentation";
import ContactPage from "./pages/Contact";
import SystemLogs from "./components/SystemLogs";
import { PanelLeft, ChevronRight, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportMarkdown, exportPDF } from "./utils/useExport";
import { getThreadId } from "./utils/thread";

// Breadcrumb header — matches the shadcn docs top bar exactly
function TopBar({
  sidebarOpen,
  onToggleSidebar,
  breadcrumbs,
  messages = [],
  threadName = "conversation",
}: {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  breadcrumbs: string[];
  messages?: any[];
  threadName?: string;
}) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[#1f1f1f] px-4 bg-[#0a0a0a]">
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="flex h-7 w-7 items-center justify-center rounded-md text-[#52525b] hover:text-[#fafafa] hover:bg-[#1f1f1f] transition-colors"
        title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <PanelLeft size={15} />
      </button>

      <div className="h-4 w-px bg-[#27272a] mx-1" />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={13} className="text-[#3f3f46]" />}
            <span
              className={
                i === breadcrumbs.length - 1
                  ? "font-semibold text-[#fafafa]"
                  : "text-[#71717a]"
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {/* Export button — only show when there are messages */}
      {messages.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[#52525b] hover:text-[#fafafa] hover:bg-[#1f1f1f] transition-colors text-xs">
              <Download size={13} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-xs"
              onClick={() => exportMarkdown(messages, threadName)}
            >
              <Download size={12} />
              Markdown (.md)
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-xs"
              onClick={() => exportPDF(messages, threadName)}
            >
              <Download size={12} />
              PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// Chat layout with sidebar + top bar
function ChatLayout({
  token,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: {
  token: string | null;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (v: boolean) => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatThreadName, setChatThreadName] = useState("conversation");

  // Listen for messages exported from chat component
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.messages) setChatMessages(e.detail.messages);
      if (e.detail?.threadName) setChatThreadName(e.detail.threadName);
    };
    window.addEventListener("chat-state", handler);
    return () => window.removeEventListener("chat-state", handler);
  }, []);

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0a0a] text-white">
      {/* Sidebar */}
      {(sidebarOpen || isMobileMenuOpen) && (
        <Sidebar
          isMobile={isMobileMenuOpen}
          onClose={() => {
            setIsMobileMenuOpen(false);
            if (isMobileMenuOpen) setSidebarOpen(false);
          }}
        />
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          breadcrumbs={["Conversations", "Chat"]}
          messages={chatMessages}
          threadName={chatThreadName}
        />
        <div className="flex-1 overflow-hidden">
          <Chat />
        </div>
      </div>
    </div>
  );
}

function SystemLogsLayout({ token }: { token: string | null }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0a0a] text-white">
      {sidebarOpen && <Sidebar />}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          breadcrumbs={["System", "Logs"]}
        />
        <div className="flex-1 overflow-y-auto p-4">
          <div className="h-full w-full border border-[#1f1f1f] bg-[#111111] rounded-lg">
            <SystemLogs />
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [appState, setAppState] = useState("loading");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleOpenSidebar = () => setIsMobileMenuOpen(true);
    window.addEventListener("open-sidebar", handleOpenSidebar);
    return () => window.removeEventListener("open-sidebar", handleOpenSidebar);
  }, []);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    setAppState(hasSeenWelcome ? "app" : "welcome");
  }, []);

  useEffect(() => {
    function handleStorage() {
      setToken(localStorage.getItem("token"));
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleWelcomeComplete = () => {
    localStorage.setItem("hasSeenWelcome", "true");
    setAppState("app");
  };

  if (appState === "loading") return <div />;

  return (
    <Router>
      <Routes>
        {appState === "welcome" && (
          <Route path="/" element={<Welcome onStart={handleWelcomeComplete} />} />
        )}

        {appState === "app" && (
          <>
            <Route path="/docs" element={<Documentation />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route
              path="/login"
              element={
                !token ? <Login updateToken={setToken} /> : <Navigate to="/chat" replace />
              }
            />
            <Route
              path="/chat"
              element={
                <ChatLayout
                  token={token}
                  isMobileMenuOpen={isMobileMenuOpen}
                  setIsMobileMenuOpen={setIsMobileMenuOpen}
                />
              }
            />
            <Route
              path="/system-logs"
              element={<SystemLogsLayout token={token} />}
            />
            <Route
              path="/"
              element={<Navigate to={token ? "/chat" : "/login"} replace />}
            />
          </>
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
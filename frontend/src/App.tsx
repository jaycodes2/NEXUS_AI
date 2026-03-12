import { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Chat from "./components/chat";
import Login from "./components/Login";
import Welcome from "./components/Welcome";
import Documentation from "./pages/Documentation";
import ContactPage from "./pages/Contact";
import SystemLogs from "./components/SystemLogs";
import { PanelLeft, ChevronRight } from "lucide-react";

function TopBar({
  sidebarOpen,
  onToggleSidebar,
  breadcrumbs,
}: {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  breadcrumbs: string[];
}) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[#1f1f1f] px-4 bg-[#0a0a0a]">
      <button
        onClick={onToggleSidebar}
        className="flex h-7 w-7 items-center justify-center rounded-md text-[#52525b] hover:text-[#fafafa] hover:bg-[#1f1f1f] transition-colors"
        title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <PanelLeft size={15} />
      </button>

      <div className="h-4 w-px bg-[#27272a] mx-1" />

      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={13} className="text-[#3f3f46]" />}
            <span className={i === breadcrumbs.length - 1 ? "font-semibold text-[#fafafa]" : "text-[#71717a]"}>
              {crumb}
            </span>
          </span>
        ))}
      </nav>
    </div>
  );
}

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

  // Close mobile drawer on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0a0a] text-white">

      {/* Desktop sidebar — hidden on mobile */}
      {sidebarOpen && (
        <div className="hidden md:flex flex-shrink-0 h-full">
          <Sidebar />
        </div>
      )}

      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer — slides in from left */}
      <div
        className={`
          md:hidden fixed top-0 left-0 h-full z-50
          transform transition-transform duration-250 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar
          isMobile
          onClose={() => setIsMobileMenuOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          breadcrumbs={["Conversations", "Chat"]}
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

  // Listen for "open-sidebar" fired from the mobile header hamburger in chat.tsx
  useEffect(() => {
    const handler = () => setIsMobileMenuOpen(true);
    window.addEventListener("open-sidebar", handler);
    return () => window.removeEventListener("open-sidebar", handler);
  }, []);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    setAppState(hasSeenWelcome ? "app" : "welcome");
  }, []);

  useEffect(() => {
    const handleStorage = () => setToken(localStorage.getItem("token"));
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
              element={!token ? <Login updateToken={setToken} /> : <Navigate to="/chat" replace />}
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
            <Route path="/system-logs" element={<SystemLogsLayout token={token} />} />
            <Route path="/" element={<Navigate to={token ? "/chat" : "/login"} replace />} />
          </>
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
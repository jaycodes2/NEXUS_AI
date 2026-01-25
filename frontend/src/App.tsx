import { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Chat from "./components/chat";
import Login from "./components/Login";
import Welcome from "./components/Welcome";
import Documentation from "./pages/Documentation";
import ContactPage from "./pages/Contact";
import SystemLogs from "./components/SystemLogs";

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
            {/* Documentation */}
            <Route path="/docs" element={<Documentation />} />

            {/* Contact */}
            <Route path="/contact" element={<ContactPage />} />

            {/* Login */}
            <Route
              path="/login"
              element={
                !token ? <Login updateToken={setToken} /> : <Navigate to="/chat" replace />
              }
            />

            {/* CHAT — FULLY RESPONSIVE */}
            <Route
              path="/chat"
              element={
                token ? (
                  <div className="h-screen w-full bg-[#0d0d0e] text-white flex">


                    {/* Sidebar on desktop only */}
                    <div className="hidden md:block">
                      <Sidebar />
                    </div>

                    {/* Chat area */}
                    <div className="flex-1 overflow-hidden">
                      <Chat />
                    </div>

                    {/* Mobile Sidebar Overlay */}
                    {isMobileMenuOpen && (
                      <div className="fixed inset-0 z-[100] flex md:hidden">
                        <div
                          className="fixed inset-0 bg-black/60 transition-opacity"
                          onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <Sidebar isMobile onClose={() => setIsMobileMenuOpen(false)} />
                      </div>
                    )}

                  </div>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* SYSTEM LOGS — RESPONSIVE */}
            <Route
              path="/system-logs"
              element={
                token ? (
                  <div className="min-h-screen w-full bg-[#0d0d0e] text-white flex">

                    <div className="hidden md:block">
                      <Sidebar />
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                      <div className="h-full w-full border border-[#2b2c2f] bg-[#111113] rounded-lg">
                        <SystemLogs />
                      </div>
                    </div>

                  </div>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Default redirect */}
            <Route
              path="/"
              element={<Navigate to={token ? "/chat" : "/login"} replace />}
            />
          </>
        )}

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

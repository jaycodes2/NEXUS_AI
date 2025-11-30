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
              element={!token ? <Login updateToken={setToken} /> : <Navigate to="/chat" replace />}
            />

            {/* CHAT PAGE — FULLY RESPONSIVE */}
            <Route
              path="/chat"
              element={
                token ? (
                  <div className="h-screen w-screen bg-[#0d0d0e] text-white flex">

                    {/* Sidebar — hidden on mobile */}
                    <div className="hidden md:block">
                      <Sidebar />
                    </div>

                    {/* Chat — full width on mobile */}
                    <div className="flex-1 h-full overflow-y-auto">
                      <div className="h-full w-full border border-[#2b2c2f] bg-[#111113]">
                        <Chat />
                      </div>
                    </div>

                  </div>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* SYSTEM LOGS — FULLY RESPONSIVE */}
            <Route
              path="/system-logs"
              element={
                token ? (
                  <div className="h-screen w-screen bg-[#0d0d0e] text-white flex">

                    {/* Sidebar — hidden on mobile */}
                    <div className="hidden md:block">
                      <Sidebar />
                    </div>

                    {/* Logs — full width on mobile */}
                    <div className="flex-1 h-full overflow-y-auto p-4">
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

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to={token ? "/chat" : "/login"} replace />} />
          </>
        )}

        {/* Catch-All */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;

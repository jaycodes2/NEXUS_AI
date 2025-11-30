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

  // token MUST be reactive
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    setAppState(hasSeenWelcome ? "app" : "welcome");
  }, []);

  // 🔥 FIX: Update token whenever logout happens (storage event)
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

            {/* Login receives updateToken */}
            <Route
              path="/login"
              element={!token ? <Login updateToken={setToken} /> : <Navigate to="/chat" replace />}
            />

            <Route
              path="/chat"
              element={
                token ? (
                  <div className="h-screen w-screen bg-[#0d0d0e] text-white flex">
                    <Sidebar />
                    <div className="flex-1 h-screen overflow-y-auto p-0">
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

            <Route
              path="/system-logs"
              element={
                token ? (
                  <div className="h-screen w-screen bg-[#0d0d0e] text-white flex">
                    <Sidebar />
                    <div className="flex-1 h-screen overflow-y-auto p-4">
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
            <Route path="/" element={<Navigate to={token ? "/chat" : "/login"} replace />} />
          </>
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./output.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";

// Initialize theme on load
const savedTheme = localStorage.getItem('nexus-chat-store');
if (savedTheme) {
  try {
    const parsed = JSON.parse(savedTheme);
    const theme = parsed?.state?.resolvedTheme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
} else {
  document.documentElement.setAttribute('data-theme', 'dark');
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

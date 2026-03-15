import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function OAuthCallback({ updateToken }: { updateToken: (t: string) => void }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const err = searchParams.get("error");

    if (err || !token) {
      setError("Google sign-in failed. Please try again.");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    // Store token, mark welcome as seen, redirect to chat
    localStorage.setItem("token", token);
    localStorage.setItem("hasSeenWelcome", "true");
    updateToken(token);
    // Small delay to let App.tsx react to token change
    setTimeout(() => navigate("/chat", { replace: true }), 100);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-[#555] text-xs">Redirecting back to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <p className="text-[#555] text-sm">Completing sign-in...</p>
      </div>
    </div>
  );
}
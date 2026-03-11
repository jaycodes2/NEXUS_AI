import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import loginBg from "../assets/login.png"
const API_URL = import.meta.env.VITE_API_URL;

export default function Login({ updateToken }: { updateToken: (t: string) => void }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) { setError("Please fill in all fields"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email address"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters long"); return; }
    if (mode === "signup" && password !== confirmPassword) { setError("Passwords do not match"); return; }

    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "login" : "register";
      const res = await fetch(`${API_URL}/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP error: ${res.status}`);
      if (data.token) {
        localStorage.setItem("token", data.token);
        updateToken(data.token);
        navigate("/chat");
      } else {
        throw new Error("No token received from server");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleKeyPress = (e: any) => { if (e.key === "Enter" && !loading) handleSubmit(e); };

  const resetForm = () => { setEmail(""); setPassword(""); setConfirmPassword(""); setError(""); };

  const toggleMode = () => { setMode(mode === "login" ? "signup" : "login"); resetForm(); };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center p-6">

      {/* Main card */}
      <div className="w-full max-w-4xl bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden flex shadow-2xl">

        {/* Left — form */}
        <div className="w-full md:w-[480px] bg-[#141414] p-10 flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-[#6b6b6b] text-sm">
              {mode === "login" ? "Login to your NEXUS account" : "Sign up to get started"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3"
                >
                  <p className="text-red-400 text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">Email</label>
              <input
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="w-full bg-[#1f1f1f] border border-[#2f2f2f] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4a4a4a] focus:outline-none focus:border-[#4a4a4a] transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">Password</label>
                {mode === "login" && (
                  <button type="button" className="text-sm text-white hover:underline">
                    Forgot your password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  className="w-full bg-[#1f1f1f] border border-[#2f2f2f] rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-[#4a4a4a] focus:outline-none focus:border-[#4a4a4a] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4a4a] hover:text-[#ececec] transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm password (signup only) */}
            <AnimatePresence>
              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  <label className="text-sm font-medium text-white">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      className="w-full bg-[#1f1f1f] border border-[#2f2f2f] rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-[#4a4a4a] focus:outline-none focus:border-[#4a4a4a] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4a4a] hover:text-[#ececec] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ececec] hover:bg-white text-black font-medium rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  {mode === "login" ? "Signing in..." : "Signing up..."}
                </>
              ) : (
                mode === "login" ? "Login" : "Sign Up"
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-[#2a2a2a]" />
              <span className="text-[#4a4a4a] text-xs">Or continue with</span>
              <div className="flex-1 h-px bg-[#2a2a2a]" />
            </div>

            {/* OAuth buttons */}
            <div className="grid grid-cols-3 gap-3">
              {/* Apple */}
              <button
                type="button"
                className="flex items-center justify-center py-2.5 rounded-lg border border-[#2f2f2f] bg-[#1f1f1f] hover:bg-[#2a2a2a] transition-colors"
              >
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              </button>
              {/* Google */}
              <button
                type="button"
                className="flex items-center justify-center py-2.5 rounded-lg border border-[#2f2f2f] bg-[#1f1f1f] hover:bg-[#2a2a2a] transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </button>
              {/* Meta */}
              <button
                type="button"
                className="flex items-center justify-center py-2.5 rounded-lg border border-[#2f2f2f] bg-[#1f1f1f] hover:bg-[#2a2a2a] transition-colors"
              >
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </button>
            </div>

            {/* Toggle mode */}
            <p className="text-center text-sm text-[#6b6b6b]">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button type="button" onClick={toggleMode} className="text-white underline underline-offset-2">
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </form>
        </div>

        {/* Right — decorative panel */}
        {/* Right — image panel */}
<div className="hidden md:block flex-1 overflow-hidden">
  <img src={loginBg} alt="" className="w-full h-full object-cover" />
</div>
      </div>

      {/* Footer */}
      <p className="text-[#4a4a4a] text-xs mt-6 text-center">
        By clicking continue, you agree to our{" "}
        <span className="underline underline-offset-2 cursor-pointer hover:text-[#6b6b6b]">Terms of Service</span>{" "}
        and{" "}
        <span className="underline underline-offset-2 cursor-pointer hover:text-[#6b6b6b]">Privacy Policy</span>.
      </p>
    </div>
  );
}
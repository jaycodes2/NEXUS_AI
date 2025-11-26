import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
const API_URL = import.meta.env.VITE_API_URL;
export default function Login({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function submit() {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    try {
  const endpoint = mode === "login" ? "login" : "register";
  const res = await fetch(`${API_URL}/api/auth/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  console.log('Response status:', res.status);
  console.log('Response ok:', res.ok);

  const data = await res.json();
  console.log('Response data:', data); // ← Check what login actually returns

  if (!res.ok) {
    throw new Error(data.message || `HTTP error: ${res.status}`);
  }

  // DEBUG: Check what fields exist
  console.log('Token exists:', !!data.token);
  console.log('All data keys:', Object.keys(data));

  if (data.token) {
    localStorage.setItem("token", data.token);
    onDone();
  } else {
    throw new Error("No token received from server");
  }
} catch (err: any) {
  console.error('Full error:', err);
  setError(err.message || "Something went wrong. Please try again.");
}
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) submit();
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    resetForm();
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-10">

        <div className="text-center space-y-3">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold"
          >
            Welcome Back
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-gray-400 text-lg"
          >
            Sign in to continue your journey
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-2xl p-12 space-y-10 w-full"
        >
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
              >
                <p className="text-red-400 text-sm text-center">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Email address</label>

            <div className="relative mt-2">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                placeholder="Enter your email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Password</label>

            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />

              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {mode === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <label className="text-sm font-medium text-gray-300">Confirm Password</label>

                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={submit}
            disabled={loading}
            className="w-full bg-white text-black hover:bg-gray-200 disabled:bg-gray-600 disabled:cursor-not-allowed font-semibold rounded-xl py-4 px-6 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                {mode === "login" ? "Sign In" : "Sign Up"}
                <ArrowRight size={20} />
              </>
            )}
          </button>

          <div className="text-center pt-4 border-t border-gray-800">
            <p className="text-gray-400 text-sm">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={toggleMode}
                disabled={loading}
                className="text-white hover:text-gray-300 font-semibold underline"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-gray-500 text-xs">By continuing, you agree to our Terms of Service</p>
        </motion.div>
      </div>
    </div>
  );
}

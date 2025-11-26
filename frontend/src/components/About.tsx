import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface AboutProps {
  onBack: () => void;
}

export default function About({ onBack }: AboutProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
    onBack();
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Simple background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#4285F4]/10 via-[#34A853]/10 to-[#EA4335]/10" />

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex justify-between items-center p-6"
      >
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
        <div className="text-xl font-bold bg-gradient-to-r from-[#4285F4] to-[#34A853] bg-clip-text text-transparent">
          About Workspace
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-[#4285F4] via-[#34A853] to-[#FBBC05] bg-clip-text text-transparent"
        >
          About Our AI Workspace
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-300 mb-12 leading-relaxed"
        >
          Your intelligent companion for chatting, learning, building, and exploring with persistent memory and smart context awareness.
        </motion.p>

        <motion.button
          onClick={handleBack}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-12 py-4 bg-gradient-to-r from-[#4285F4] to-[#34A853] hover:from-[#3367D6] hover:to-[#2E8B57] rounded-2xl font-semibold text-lg text-white shadow-2xl shadow-blue-500/30 hover:shadow-green-500/30 transition-all duration-300 transform hover:scale-105"
        >
          Get Started Now
        </motion.button>
      </div>
    </div>
  );
}
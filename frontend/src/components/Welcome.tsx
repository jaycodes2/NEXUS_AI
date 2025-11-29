"use client";
import { motion } from "framer-motion";
import React, { useState } from "react";
import { TypewriterEffectSmooth } from "./typewriter-effect";
import Documentation from "../pages/Documentation";

// ───────────────── ABOUT PAGE ─────────────────
function AboutPage({
  onBack,
  onGetStarted,
}: {
  onBack: () => void;
  onGetStarted: () => void;
}) {
  return (
    <div className="min-h-[100vh] bg-black text-white relative overflow-x-hidden overflow-y-auto px-4 sm:px-6">
      <div className="relative z-10 min-h-[100vh] flex items-center justify-center py-12">
        <div className="text-center max-w-3xl mx-auto">

          <motion.button
            onClick={onBack}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors mx-auto text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </motion.button>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[#4285F4] via-[#34A853] to-[#FBBC05] bg-clip-text text-transparent"
          >
            About Our AI Workspace
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-gray-300 mb-10 max-w-xl mx-auto leading-relaxed"
          >
            Your intelligent companion for chatting, learning, building, and exploring with persistent memory and smart context awareness.
          </motion.p>

          <motion.button
            onClick={onGetStarted}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="px-8 py-3 sm:px-12 sm:py-4 bg-gradient-to-r from-[#4285F4] to-[#34A853] hover:from-[#3367D6] hover:to-[#2E8B57] rounded-2xl font-semibold text-base sm:text-lg text-white shadow-2xl shadow-blue-500/30 hover:shadow-green-500/30 transition-all duration-300 transform hover:scale-105"
          >
            Get Started Now
          </motion.button>

        </div>
      </div>
    </div>
  );
}

// ───────────────── WELCOME CONTENT ─────────────────
function WelcomeContent({
  onStart,
  onShowDocumentation,
}: {
  onStart: () => void;
  onShowDocumentation: () => void;
}) {
  const words = [
    { text: "Chat," },
    { text: "learn," },
    { text: "build," },
    { text: "and" },
    { text: "explore", className: "text-blue-500" },
  ];

  return (
    <div className="min-h-[100vh] bg-black text-white overflow-x-hidden overflow-y-auto px-4 sm:px-6">

      <div className="min-h-[100vh] flex items-center justify-center py-10 sm:py-16">
        <div className="text-center max-w-3xl mx-auto">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-8"
          >
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-[#4285F4] rounded-full"></div>
              <div className="w-2 h-2 bg-[#34A853] rounded-full"></div>
              <div className="w-2 h-2 bg-[#FBBC05] rounded-full"></div>
              <div className="w-2 h-2 bg-[#EA4335] rounded-full"></div>
            </div>
            <span className="text-xs sm:text-sm text-gray-300">Powered by AI</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl md:text-8xl font-bold mb-2 bg-gradient-to-r from-[#4285F4] via-[#34A853] to-[#EA4335] bg-clip-text text-transparent"
          >
            Your AI
          </motion.h1>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-[#FBBC05] via-[#EA4335] to-[#4285F4] bg-clip-text text-transparent"
          >
            Workspace
          </motion.h1>

          {/* Typewriter */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5">
            <TypewriterEffectSmooth words={words} />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-base sm:text-lg md:text-2xl text-gray-300 mb-10 max-w-xl mx-auto leading-relaxed"
          >
            With <span className="text-[#34A853] font-semibold">persistent memory</span> and{" "}
            <span className="text-[#4285F4] font-semibold">intelligent context</span>.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14"
          >
            <motion.button
              onClick={onStart}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative px-8 py-3 sm:px-12 sm:py-4 bg-gradient-to-r from-[#4285F4] to-[#34A853] hover:from-[#3367D6] hover:to-[#2E8B57] rounded-2xl font-semibold text-base sm:text-lg text-white shadow-2xl shadow-blue-500/30 hover:shadow-green-500/30 transition-all"
            >
              Get Started →
            </motion.button>

            <motion.button
              onClick={onShowDocumentation}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 sm:px-12 sm:py-4 border-2 border-white/20 text-white/80 hover:text-white hover:border-white/40 rounded-2xl font-semibold text-base sm:text-lg backdrop-blur-sm hover:bg-white/5 transition-all"
            >
              Learn More →
            </motion.button>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto mb-16"
          >
            {[
              { icon: "💬", title: "Smart Chat", desc: "Intelligent conversations", color: "from-[#4285F4] to-[#34A853]" },
              { icon: "🚀", title: "Build Fast", desc: "Code generation & prototyping", color: "from-[#FBBC05] to-[#EA4335]" },
              { icon: "🎯", title: "Learn & Grow", desc: "Knowledge expansion", color: "from-[#34A853] to-[#4285F4]" },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                whileHover={{ scale: 1.03 }}
                className="p-4 sm:p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl cursor-pointer"
              >
                <div className={`text-2xl sm:text-3xl mb-3 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                  {feature.icon}
                </div>
                <h3 className="text-white font-semibold">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom CTA */}
          <div className="py-12 sm:py-20">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-white"
            >
              Ready to Get Started?
            </motion.h2>

            <motion.button
              onClick={onStart}
              whileHover={{ scale: 1.05 }}
              className="px-8 py-3 bg-gradient-to-r from-[#4285F4] to-[#34A853] rounded-xl font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-green-500/30 text-base sm:text-lg"
            >
              Begin Your Journey
            </motion.button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ───────────────── MAIN EXPORT ─────────────────
export default function Welcome({ onStart }: { onStart: () => void }) {
  const [showAbout, setShowAbout] = useState(false);
  const [showDocumentation, setShowDocumentation] = useState(false);

  const handleBackToHome = () => {
    setShowAbout(false);
    setShowDocumentation(false);
    window.scrollTo(0, 0);
  };

  const handleGetStartedFromAbout = () => {
    setShowAbout(false);
    onStart();
  };

  const handleShowDocumentation = () => {
    setShowDocumentation(true);
  };

  if (showDocumentation) {
    return <Documentation onBack={handleBackToHome} />;
  }

  if (showAbout) {
    return (
      <AboutPage
        onBack={handleBackToHome}
        onGetStarted={handleGetStartedFromAbout}
      />
    );
  }

  return (
    <WelcomeContent
      onStart={onStart}
      onShowDocumentation={handleShowDocumentation}
    />
  );
}

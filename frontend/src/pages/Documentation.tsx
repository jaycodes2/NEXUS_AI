import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";

// --- EFFECT 1: FLIP WORDS (The "Typewriter" replacement) ---
const FlipWords = ({ words }: { words: string[] }) => {
  const [currentWord, setCurrentWord] = useState(words[0]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [words.length]);

  useEffect(() => {
    setCurrentWord(words[index]);
  }, [index, words]);

  return (
    <span className="relative inline-block w-[120px] text-left">
      <AnimatePresence mode="wait">
        <motion.span
          key={currentWord}
          initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="block absolute top-0 left-0 text-indigo-400 font-bold"
        >
          {currentWord}
        </motion.span>
      </AnimatePresence>
      <span className="opacity-0">{currentWord}</span> {/* Invisible spacer */}
    </span>
  );
};

// --- EFFECT 2: SPOTLIGHT CARD (Mouse-tracking glow) ---
const SpotlightCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={`group relative border border-zinc-800 bg-zinc-900 overflow-hidden rounded-xl ${className}`}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(79, 70, 229, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
};

// --- EFFECT 3: BACKGROUND GRID ---
const GridBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
  </div>
);

// --- MAIN COMPONENT ---

export default function Documentation({ onBack }: { onBack: () => void }) {
  return (
    <div className="relative h-full bg-black text-zinc-200 overflow-y-auto selection:bg-indigo-500/30">
      <GridBackground />
      
      {/* Back Button */}
      <motion.button
        onClick={onBack}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-zinc-800 hover:border-zinc-600"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </motion.button>
      
      <div className="relative z-10 p-8 md:p-12 max-w-6xl mx-auto">
        
        {/* HERO SECTION WITH FLIP WORDS */}
        <div className="mb-32 mt-12 text-center">
          <motion.div
             initial={{ opacity: 0, scale: 0.5 }}
             animate={{ opacity: 1, scale: 1 }}
             className="inline-block mb-4 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-md text-xs font-mono text-zinc-400"
          >
            v2.0 Documentation
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white">
            Build AI Chat Apps that are <br className="hidden md:block" />
            <FlipWords words={["Scalable", "Modern", "Secure", "Fast"]} />
          </h1>
          
          <p className="text-zinc-500 text-xl max-w-2xl mx-auto mt-4">
             A complete technical breakdown of the architecture, from the database schema to the AI model integration.
          </p>
        </div>

        {/* SPOTLIGHT CARDS SECTION (Replacing standard Grid) */}
        <section className="mb-24">
           <h2 className="text-3xl font-bold mb-8 text-white pl-2 border-l-4 border-indigo-500">Core Features</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Auth & Security", desc: "JWT based authentication with persistent sessions and protected API routes.", icon: "🔒" },
                { title: "Thread Logic", desc: "Smart context management ensuring the AI remembers previous messages.", icon: "🧠" },
                { title: "Google Gemini", desc: "Direct integration with the Gemini Pro model for high-fidelity responses.", icon: "✨" },
                { title: "Real-time UI", desc: "Optimistic UI updates making the chat feel instant and responsive.", icon: "⚡" },
                { title: "Auto-Titling", desc: "Background jobs that analyze conversation context to name threads.", icon: "🏷️" },
                { title: "Data Privacy", desc: "Self-hosted MongoDB instance ensuring you own your chat data.", icon: "🛡️" }
              ].map((item, i) => (
                <SpotlightCard key={i} className="p-6 h-full">
                   <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-xl mb-4 shadow-inner">
                     {item.icon}
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                   <p className="text-zinc-400 text-sm leading-relaxed">
                     {item.desc}
                   </p>
                </SpotlightCard>
              ))}
           </div>
        </section>

        {/* BENTO GRID (Tech Stack) - Kept from previous step but cleaned up */}
        <section className="mb-24">
           <h2 className="text-3xl font-bold mb-8 text-white">Tech Stack</h2>
           <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-[500px]">
              
              {/* Large Card 1 */}
              <SpotlightCard className="md:col-span-2 md:row-span-2 p-8 flex flex-col justify-between bg-gradient-to-br from-zinc-900 to-zinc-900/50">
                 <div>
                    <div className="text-indigo-500 font-mono mb-2">Frontend</div>
                    <h3 className="text-3xl font-bold text-white">React + TypeScript</h3>
                    <p className="mt-4 text-zinc-400">Built with strict type safety and component modularity. Utilizing Framer Motion for animations and Tailwind for styling.</p>
                 </div>
                 <div className="w-full h-32 bg-indigo-500/10 rounded-lg border border-indigo-500/20 mt-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]"></div>
                 </div>
              </SpotlightCard>

              {/* Small Card 1 */}
              <SpotlightCard className="md:col-span-2 p-6 flex items-center justify-between">
                 <div>
                    <h3 className="text-xl font-bold text-green-400">MongoDB</h3>
                    <p className="text-zinc-500 text-sm">Mongoose Schema Validation</p>
                 </div>
                 <div className="text-4xl">🍃</div>
              </SpotlightCard>

              {/* Small Card 2 */}
              <SpotlightCard className="md:col-span-1 p-6">
                 <h3 className="text-xl font-bold text-yellow-400">Node.js</h3>
                 <p className="text-zinc-500 text-sm mt-2">Express REST API</p>
              </SpotlightCard>

              {/* Small Card 3 */}
              <SpotlightCard className="md:col-span-1 p-6">
                 <h3 className="text-xl font-bold text-red-400">Gemini</h3>
                 <p className="text-zinc-500 text-sm mt-2">Google AI Model</p>
              </SpotlightCard>

           </div>
        </section>

        {/* SIMPLE API TABLE WITH GLOW */}
        <section className="mb-24">
           <h2 className="text-3xl font-bold mb-8 text-white">Endpoints</h2>
           <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30 backdrop-blur-sm">
             {[
               { verb: "POST", path: "/api/ai/query", desc: "Main chat interaction endpoint" },
               { verb: "GET", path: "/api/ai/threads", desc: "Retrieve all user conversations" },
               { verb: "DELETE", path: "/api/ai/threads/:id", desc: "Hard delete a conversation" },
             ].map((row, idx) => (
               <div key={idx} className="flex items-center p-4 border-b border-zinc-800 last:border-0 hover:bg-white/5 transition-colors group">
                  <span className={`w-20 font-mono font-bold ${row.verb === 'POST' ? 'text-green-400' : row.verb === 'DELETE' ? 'text-red-400' : 'text-blue-400'}`}>
                    {row.verb}
                  </span>
                  <code className="text-zinc-300 font-mono flex-1 group-hover:text-white transition-colors">{row.path}</code>
                  <span className="text-zinc-500 text-sm">{row.desc}</span>
               </div>
             ))}
           </div>
        </section>

      </div>
    </div>
  );
}
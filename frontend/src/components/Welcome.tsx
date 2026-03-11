"use client";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import Documentation from "../pages/Documentation";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import TermsOfService from "../pages/TermsOfService";
import License from "../pages/License";

// ─── NOISE TEXTURE OVERLAY ────────────────────────────────────────────────────
function NoiseOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] opacity-[0.025]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "128px 128px",
      }}
    />
  );
}

// ─── HORIZONTAL RULE ─────────────────────────────────────────────────────────
function HR() {
  return <div className="w-full h-px" style={{ background: "rgba(255,255,255,0.06)" }} />;
}

// ─── TYPEWRITER ───────────────────────────────────────────────────────────────
function Typewriter({ words }: { words: string[] }) {
  const [idx, setIdx] = useState(0);
  const [txt, setTxt] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    const target = words[idx];
    if (!del && txt.length < target.length) {
      const t = setTimeout(() => setTxt(target.slice(0, txt.length + 1)), 75);
      return () => clearTimeout(t);
    }
    if (!del && txt.length === target.length) {
      const t = setTimeout(() => setDel(true), 2400);
      return () => clearTimeout(t);
    }
    if (del && txt.length > 0) {
      const t = setTimeout(() => setTxt(txt.slice(0, -1)), 40);
      return () => clearTimeout(t);
    }
    if (del && txt.length === 0) { setDel(false); setIdx((i) => (i + 1) % words.length); }
  }, [txt, del, idx, words]);
  return (
    <span className="text-white">
      {txt}
      <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        className="inline-block w-[2px] h-[0.8em] bg-white ml-0.5 align-middle" />
    </span>
  );
}

// ─── SPOTLIGHT CURSOR ─────────────────────────────────────────────────────────
function CursorSpotlight() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 50, damping: 20 });
  const sy = useSpring(y, { stiffness: 50, damping: 20 });
  useEffect(() => {
    const h = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  return (
    <motion.div className="pointer-events-none fixed inset-0 z-20"
      style={{
        background: useTransform([sx, sy], ([cx, cy]) =>
          `radial-gradient(600px circle at ${cx}px ${cy}px, rgba(255,255,255,0.025), transparent 55%)`
        ),
      }}
    />
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function NavBar({ onDocs, onStart }: { onDocs: () => void; onStart: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.nav initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(0,0,0,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "none",
      }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-black" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4l8 11V4h3v16h-4L9 9v11H6V4z" />
            </svg>
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">NEXUS</span>
          <span className="hidden sm:block text-neutral-700 text-xs px-2 py-0.5 rounded-full border border-white/8">v2.0</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Features" },
            { label: "How it works" },
            { label: "Documentation", action: onDocs },
          ].map((item) => (
            <button key={item.label} onClick={item.action}
              className="text-neutral-500 hover:text-white text-sm transition-colors duration-150">
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onStart} className="text-neutral-500 hover:text-white text-sm transition-colors hidden sm:block">
            Sign in
          </button>
          <motion.button onClick={onStart} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-black bg-white hover:bg-neutral-100 transition-colors">
            Get started
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function HeroSection({ onStart, onDocs }: { onStart: () => void; onDocs: () => void }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const op = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#000" }}>

      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 75% 65% at 50% 45%, black 30%, transparent 100%)",
        }}
      />

      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ width: "600px", height: "1px", background: "linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)" }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ width: "500px", height: "200px", background: "radial-gradient(ellipse at top, rgba(255,255,255,0.06) 0%, transparent 70%)" }} />

      <motion.div style={{ y, opacity: op }} className="relative z-10 text-center px-6 max-w-5xl mx-auto w-full pt-20">

        {/* Eyebrow badge */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#a3a3a3" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Powered by Gemini 2.5 Flash
            <span className="w-px h-3 bg-white/15" />
            <span className="text-white/40">v2.0</span>
          </div>
        </motion.div>

        {/* Main headline — editorial, large, tight */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1 }}>
          <h1 className="font-bold tracking-tight text-white leading-[0.95]"
            style={{ fontSize: "clamp(3.5rem, 10vw, 8rem)", letterSpacing: "-0.04em" }}>
            The AI that
            <br />
            <span className="text-neutral-600">actually </span>
            <Typewriter words={["remembers.", "understands.", "thinks ahead.", "never forgets."]} />
          </h1>
        </motion.div>

        {/* Divider line under headline */}
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
          className="w-24 h-px mx-auto my-8 bg-white/20" />

        {/* Subtext */}
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
          className="text-neutral-500 max-w-lg mx-auto mb-10 leading-relaxed"
          style={{ fontSize: "clamp(0.95rem, 2vw, 1.1rem)" }}>
          NEXUS builds persistent, semantic memory across every conversation — powered by vector embeddings and RAG.
          Context that never expires.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <motion.button onClick={onStart} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="group flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-neutral-100 transition-colors">
            Start for free
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </motion.button>
          <motion.button onClick={onDocs} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
            className="px-7 py-3.5 rounded-xl text-neutral-500 hover:text-white text-sm font-medium transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            View documentation
          </motion.button>
        </motion.div>

        {/* Stat strip */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="flex items-center justify-center gap-10 mt-20 pt-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {[
            { n: "Gemini 2.5", l: "AI Model" },
            { n: "Vector DB", l: "Memory engine" },
            { n: "RAG", l: "Context retrieval" },
            { n: "JWT", l: "Auth" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="text-white text-sm font-semibold">{s.n}</p>
              <p className="text-neutral-600 text-xs mt-0.5">{s.l}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, #000)" }} />
    </section>
  );
}

// ─── HOW IT WORKS (new section) ───────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "You send a message",
      desc: "NEXUS generates a vector embedding of your message and searches your memory store for semantically related past conversations.",
    },
    {
      num: "02",
      title: "Memory is retrieved",
      desc: "The most relevant past context is surfaced — not keyword matched, but meaning matched — across every thread you've ever had.",
    },
    {
      num: "03",
      title: "AI responds with context",
      desc: "Gemini 2.5 Flash generates a response grounded in your actual history via RAG. No hallucinations. No repetition.",
    },
    {
      num: "04",
      title: "Memory grows over time",
      desc: "The conversation is stored as a new embedding. Threads auto-title. Your AI gets smarter every single session.",
    },
  ];

  return (
    <section className="py-28 px-6" style={{ background: "#000" }}>
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mb-16">
          <p className="text-neutral-600 text-xs uppercase tracking-widest mb-4">How it works</p>
          <h2 className="text-white font-bold tracking-tight"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            Memory that works
            <br />
            <span className="text-neutral-600">like yours does.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: "rgba(255,255,255,0.05)" }}>
          {steps.map((step, i) => (
            <motion.div key={step.num} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="p-8 group hover:bg-white/[0.02] transition-colors"
              style={{ background: "#000" }}>
              <div className="flex items-start gap-5">
                <span className="text-neutral-800 font-mono text-xs font-bold flex-shrink-0 mt-1">{step.num}</span>
                <div>
                  <h3 className="text-white font-semibold text-base mb-2">{step.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FEATURES BENTO ───────────────────────────────────────────────────────────
function GlowCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hov, setHov] = useState(false);
  const onMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  }, []);
  return (
    <div ref={ref} onMouseMove={onMove} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className={`relative rounded-2xl overflow-hidden transition-all duration-200 ${className}`}
      style={{ background: "#0a0a0a", border: `1px solid ${hov ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)"}` }}>
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{ opacity: hov ? 1 : 0, background: `radial-gradient(280px circle at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.04), transparent)` }} />
      {children}
    </div>
  );
}

const FEATURES = [
  {
    tag: "Memory",
    title: "Persistent Memory",
    desc: "Every conversation is vectorised and stored. NEXUS retrieves semantically relevant context from any past thread — across sessions, automatically.",
    span: "md:col-span-2",
    visual: (
      <div className="relative h-32 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, transparent 70%)" }} />
        {[28, 20, 12].map((r, i) => (
          <div key={i} className="absolute rounded-full border border-white/5" style={{ width: r * 2 * 2, height: r * 2 * 2 }} />
        ))}
        <div className="w-3 h-3 rounded-full bg-white/80 z-10 shadow-[0_0_16px_rgba(255,255,255,0.5)]" />
        {[0, 60, 120, 180, 240, 300].map((a, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full bg-white/30"
            style={{ left: `calc(50% + ${Math.cos(a * Math.PI / 180) * 52}px)`, top: `calc(50% + ${Math.sin(a * Math.PI / 180) * 52}px)` }} />
        ))}
      </div>
    ),
  },
  {
    tag: "Search",
    title: "Semantic Search",
    desc: "Search by meaning. Find what you discussed even if you can't recall the exact words.",
    span: "md:col-span-1",
    visual: (
      <div className="h-32 flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white/20 border border-white/10" />
        </div>
      </div>
    ),
  },
  {
    tag: "AI",
    title: "RAG Intelligence",
    desc: "Responses grounded in your actual history. Zero hallucinations.",
    span: "md:col-span-1",
    visual: (
      <div className="h-32 flex items-center justify-center gap-2">
        {[3, 5, 4, 6, 3, 4, 5].map((h, i) => (
          <motion.div key={i} className="w-1 rounded-full bg-white/20"
            animate={{ height: [h * 4, h * 8, h * 4] }}
            transition={{ duration: 1.2 + i * 0.1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    ),
  },
  {
    tag: "Context",
    title: "Cross-Thread Awareness",
    desc: "Reference anything you've ever said — across any thread, any session, any time.",
    span: "md:col-span-2",
    visual: (
      <div className="h-32 flex items-center justify-center gap-3">
        {[["A", "B"], ["B", "C"], ["A", "C"]].map(([from, to], i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-neutral-600"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-white/30">{from}</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="text-white/30">{to}</span>
          </div>
        ))}
      </div>
    ),
  },
];

function FeaturesSection() {
  return (
    <section className="py-28 px-6" style={{ background: "#000" }}>
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div>
            <p className="text-neutral-600 text-xs uppercase tracking-widest mb-4">Capabilities</p>
            <h2 className="text-white font-bold tracking-tight"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              Not just a chat window.
              <br />
              <span className="text-neutral-600">Real infrastructure.</span>
            </h2>
          </div>
          <p className="text-neutral-500 text-sm max-w-xs leading-relaxed md:text-right">
            Built on MongoDB Atlas Vector Search, Gemini embeddings, and a custom RAG pipeline.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.07 }} className={f.span}>
              <GlowCard className="h-full">
                <div className="p-6">
                  {f.visual}
                  <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold text-sm">{f.title}</h3>
                      <span className="text-neutral-700 text-xs uppercase tracking-widest">{f.tag}</span>
                    </div>
                    <p className="text-neutral-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── TECH STRIP ───────────────────────────────────────────────────────────────
function TechStrip() {
  const items = ["React + TypeScript", "Node.js + Express", "MongoDB Atlas", "Vector Search", "Gemini 2.5 Flash", "JWT Auth", "RAG Pipeline", "Framer Motion"];
  return (
    <div className="py-6 overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "#000" }}>
      <div className="flex gap-12 w-max" style={{ animation: "techScroll 30s linear infinite" }}>
        {[...items, ...items].map((item, i) => (
          <span key={i} className="text-neutral-700 text-xs uppercase tracking-widest whitespace-nowrap flex items-center gap-3">
            <span className="w-1 h-1 rounded-full bg-white/20" />
            {item}
          </span>
        ))}
      </div>
      <style>{`@keyframes techScroll { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </div>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTASection({ onStart }: { onStart: () => void }) {
  return (
    <section className="py-28 px-6" style={{ background: "#000" }}>
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden"
          style={{ background: "#080808", border: "1px solid rgba(255,255,255,0.08)" }}>

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-24 h-px" style={{ background: "linear-gradient(to right, rgba(255,255,255,0.3), transparent)" }} />
          <div className="absolute top-0 left-0 w-px h-24" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)" }} />
          <div className="absolute bottom-0 right-0 w-24 h-px" style={{ background: "linear-gradient(to left, rgba(255,255,255,0.3), transparent)" }} />
          <div className="absolute bottom-0 right-0 w-px h-24" style={{ background: "linear-gradient(to top, rgba(255,255,255,0.3), transparent)" }} />

          {/* Radial glow centre */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,255,255,0.04), transparent)" }} />

          <div className="relative z-10 p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-white font-bold tracking-tight mb-3"
                style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", letterSpacing: "-0.03em" }}>
                Build smarter.
                <br />Start today.
              </h2>
              <p className="text-neutral-500 text-sm max-w-sm leading-relaxed">
                Free to start. Persistent AI memory from your very first conversation.
              </p>
            </div>
            <div className="flex flex-col gap-3 flex-shrink-0">
              <motion.button onClick={onStart} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="px-8 py-3.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-neutral-100 transition-colors whitespace-nowrap">
                Get started — it's free
              </motion.button>
              <motion.button onClick={onStart} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                className="px-8 py-3 rounded-xl text-neutral-500 hover:text-white text-sm transition-colors text-center"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                Book a demo
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer({ onDocs, onPrivacy, onTerms, onLicense }: { onDocs: () => void; onPrivacy: () => void; onTerms: () => void; onLicense: () => void }) {
  return (
    <footer className="px-6 pt-12 pb-8" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#000" }}>
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center">
                <svg className="w-3 h-3 text-black" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4l8 11V4h3v16h-4L9 9v11H6V4z" /></svg>
              </div>
              <span className="text-white text-sm font-semibold">NEXUS</span>
            </div>
            <p className="text-neutral-600 text-xs leading-relaxed max-w-xs">
              AI with persistent semantic memory. Built on MongoDB Atlas Vector Search and Gemini 2.5 Flash.
            </p>
          </div>
          {[
            { title: "Resources", links: [{ l: "Documentation", fn: onDocs }] },
            { title: "Legal", links: [{ l: "Privacy", fn: onPrivacy }, { l: "Terms", fn: onTerms }, { l: "License", fn: onLicense }] },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-white text-xs font-medium mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.l}>
                    <button onClick={l.fn} className="text-neutral-600 hover:text-white text-xs transition-colors">{l.l}</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <HR />
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-neutral-700 text-xs">© 2026 NEXUS AI. MIT License.</p>
          <p className="text-neutral-700 text-xs">React · Node.js · MongoDB Atlas · Gemini 2.5 Flash</p>
        </div>
      </div>
    </footer>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Welcome({ onStart }: { onStart: () => void }) {
  const [page, setPage] = useState<"home" | "docs" | "privacy" | "terms" | "license">("home");

  if (page === "docs")    return <Documentation onBack={() => setPage("home")} />;
  if (page === "privacy") return <PrivacyPolicy onBack={() => setPage("home")} />;
  if (page === "terms")   return <TermsOfService onBack={() => setPage("home")} />;
  if (page === "license") return <License onBack={() => setPage("home")} />;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#000" }}>
      <NoiseOverlay />
      <CursorSpotlight />
      <NavBar onDocs={() => setPage("docs")} onStart={onStart} />
      <HeroSection onStart={onStart} onDocs={() => setPage("docs")} />
      <TechStrip />
      <HowItWorksSection />
      <FeaturesSection />
      <CTASection onStart={onStart} />
      <Footer
        onDocs={() => setPage("docs")}
        onPrivacy={() => setPage("privacy")}
        onTerms={() => setPage("terms")}
        onLicense={() => setPage("license")}
      />
    </div>
  );
}
import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useMotionTemplate } from "framer-motion";

// ─── SPOTLIGHT CARD ───────────────────────────────────────────────────────────
const SpotlightCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }
  return (
    <div className={`group relative overflow-hidden rounded-2xl ${className}`}
      style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)" }}
      onMouseMove={handleMouseMove}>
      <motion.div className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{ background: useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.04), transparent 70%)` }} />
      <div className="relative h-full">{children}</div>
    </div>
  );
};

// ─── CODE BLOCK ───────────────────────────────────────────────────────────────
function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-xl overflow-hidden my-4" style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <span className="text-neutral-600 text-xs font-mono">{lang}</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white transition-colors">
          {copied ? (
            <><svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg><span className="text-emerald-400">Copied</span></>
          ) : (
            <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-neutral-300 font-mono">{code}</code>
      </pre>
    </div>
  );
}

// ─── SECTION HEADING ──────────────────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-white font-bold text-2xl tracking-tight mb-6 flex items-center gap-3"
      style={{ letterSpacing: "-0.02em" }}>
      <span className="w-1 h-6 rounded-full bg-white/20 flex-shrink-0" />
      {children}
    </h2>
  );
}

// ─── NAV SIDEBAR ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "features", label: "Features" },
  { id: "tech-stack", label: "Tech Stack" },
  { id: "quick-start", label: "Quick Start" },
  { id: "how-it-works", label: "How It Works" },
  { id: "api", label: "API Endpoints" },
  { id: "memory", label: "Memory System" },
  { id: "deployment", label: "Deployment" },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Documentation({ onBack }: { onBack?: () => void }) {
  const handleBack = onBack ?? (() => window.history.back());
  const [activeSection, setActiveSection] = useState("overview");
  const mainRef = useRef<HTMLDivElement>(null);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el && mainRef.current) {
      mainRef.current.scrollTo({ top: el.offsetTop - 24, behavior: "smooth" });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#000", color: "#fff" }}>

      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 py-8 px-4 overflow-y-auto"
        style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}>
        {/* Back */}
        <button onClick={handleBack}
          className="flex items-center gap-2 text-neutral-500 hover:text-white text-sm mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to home
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
            <svg className="w-3 h-3 text-black" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4l8 11V4h3v16h-4L9 9v11H6V4z" /></svg>
          </div>
          <span className="text-white text-sm font-semibold">Nexus AI</span>
          <span className="text-neutral-600 text-xs ml-1">v2.0</span>
        </div>

        {/* Nav */}
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => scrollTo(item.id)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all"
              style={{
                color: activeSection === item.id ? "white" : "#525252",
                background: activeSection === item.id ? "rgba(255,255,255,0.06)" : "transparent",
              }}>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main content ── */}
      <div ref={mainRef} className="flex-1 overflow-y-auto">
        {/* Mobile back button */}
        <div className="lg:hidden sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
          style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <button onClick={handleBack} className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-12 space-y-20">

          {/* ── OVERVIEW ── */}
          <section id="overview">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-neutral-400 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                v2.0 Documentation
              </div>
              <h1 className="text-white font-bold tracking-tight mb-4"
                style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
                NEXUS AI
                <br />
                <span className="text-neutral-500">Developer Reference</span>
              </h1>
              <p className="text-neutral-500 text-base leading-relaxed max-w-xl">
                A production-ready full-stack conversational AI platform with long-term memory and semantic understanding. Complete technical breakdown from database schema to AI model integration.
              </p>
            </motion.div>
          </section>

          {/* ── FEATURES ── */}
          <section id="features">
            <SectionHeading>Features</SectionHeading>

            <div className="space-y-8">
              {/* AI Chat */}
              <div>
                <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                  <span className="text-neutral-500">01</span> AI Chat Excellence
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { title: "Gemini 2.5 Flash", desc: "Real-time conversational AI with smooth message rendering" },
                    { title: "Typing Indicators", desc: "Enhanced user experience with visual feedback and auto-scroll" },
                    { title: "Streaming Responses", desc: "Live AI response delivery as tokens are generated" },
                  ].map((f) => (
                    <SpotlightCard key={f.title} className="p-4">
                      <p className="text-white text-xs font-semibold mb-1">{f.title}</p>
                      <p className="text-neutral-500 text-xs leading-relaxed">{f.desc}</p>
                    </SpotlightCard>
                  ))}
                </div>
              </div>

              {/* Memory */}
              <div>
                <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                  <span className="text-neutral-500">02</span> Long-Term Memory & Intelligence
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { title: "Semantic Memory + Vector Search", desc: "All prompts and responses are embedded and stored using MongoDB Atlas Vector Search for meaning-based retrieval." },
                    { title: "Retrieval-Augmented Generation", desc: "AI retrieves relevant past conversations before generating context-aware responses." },
                    { title: "Cross-Thread Memory Recall", desc: "AI references information from any previous conversation thread seamlessly." },
                    { title: "Hallucination-Safe Memory", desc: "Transparent responses when no relevant memory exists — no fabricated context." },
                    { title: "Semantic Chat History Search", desc: "Search past conversations by meaning, not exact keywords." },
                    { title: "Smart Thread Intelligence", desc: "AI-generated summaries and semantic thread renaming automatically." },
                  ].map((f) => (
                    <SpotlightCard key={f.title} className="p-4">
                      <p className="text-white text-xs font-semibold mb-1">{f.title}</p>
                      <p className="text-neutral-500 text-xs leading-relaxed">{f.desc}</p>
                    </SpotlightCard>
                  ))}
                </div>
              </div>

              {/* Auth + Threading */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <span className="text-neutral-500">03</span> Secure Authentication
                  </h3>
                  <ul className="space-y-2">
                    {["JWT-based authentication with email/password", "Protected routes with automatic redirect logic", "Persistent user sessions"].map((i) => (
                      <li key={i} className="flex items-start gap-2 text-neutral-500 text-sm">
                        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <span className="text-neutral-500">04</span> Intelligent Threading
                  </h3>
                  <ul className="space-y-2">
                    {["Multi-thread conversation organisation", "Auto-generated titles from conversation content", "Easy switching, creation, and deletion", "Semantic thread organisation with summaries"].map((i) => (
                      <li key={i} className="flex items-start gap-2 text-neutral-500 text-sm">
                        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* ── TECH STACK ── */}
          <section id="tech-stack">
            <SectionHeading>Tech Stack</SectionHeading>
            <div className="space-y-4">
              {[
                {
                  label: "Frontend",
                  items: [
                    { name: "React + TypeScript", role: "Type-safe component architecture" },
                    { name: "Tailwind CSS", role: "Utility-first styling system" },
                    { name: "React Router", role: "Client-side routing" },
                    { name: "Framer Motion", role: "Animations and micro-interactions" },
                  ],
                },
                {
                  label: "Backend",
                  items: [
                    { name: "Node.js + Express", role: "Robust server framework" },
                    { name: "MongoDB + Mongoose", role: "Database with ODM" },
                    { name: "MongoDB Atlas Vector Search", role: "Semantic memory storage and retrieval" },
                    { name: "JWT", role: "Secure authentication" },
                  ],
                },
                {
                  label: "AI & Memory",
                  items: [
                    { name: "Google Gemini 2.5 Flash", role: "Primary conversation model" },
                    { name: "Vector Embeddings", role: "Semantic representation of conversations" },
                    { name: "RAG", role: "Context-aware response generation" },
                    { name: "Semantic Search", role: "Meaning-based conversation retrieval" },
                  ],
                },
              ].map((group) => (
                <SpotlightCard key={group.label} className="p-5">
                  <p className="text-neutral-500 text-xs uppercase tracking-widest mb-4">{group.label}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.items.map((item) => (
                      <div key={item.name} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20 flex-shrink-0 mt-1.5" />
                        <div>
                          <p className="text-white text-xs font-medium">{item.name}</p>
                          <p className="text-neutral-600 text-xs">{item.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </section>

          {/* ── QUICK START ── */}
          <section id="quick-start">
            <SectionHeading>Quick Start</SectionHeading>

            <p className="text-neutral-500 text-sm mb-6">Prerequisites: Node.js 16+, MongoDB Atlas (Vector Search enabled), Google Gemini API key.</p>

            <div className="space-y-8">
              <div>
                <h3 className="text-white text-sm font-semibold mb-3">Backend Setup</h3>
                <CodeBlock lang="bash" code={`cd backend
npm install
cp .env.example .env`} />
                <p className="text-neutral-500 text-sm mb-2">Environment variables:</p>
                <CodeBlock lang="env" code={`MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
VECTOR_SEARCH_INDEX_NAME=conversation_embeddings
EMBEDDING_MODEL=embedding-001`} />
                <CodeBlock lang="bash" code={`npm run dev`} />
              </div>

              <div>
                <h3 className="text-white text-sm font-semibold mb-3">Frontend Setup</h3>
                <CodeBlock lang="bash" code={`cd frontend
npm install
cp .env.example .env`} />
                <CodeBlock lang="env" code={`VITE_API_URL=http://localhost:5000/api`} />
                <CodeBlock lang="bash" code={`npm run dev`} />
              </div>

              <div>
                <h3 className="text-white text-sm font-semibold mb-3">Project Structure</h3>
                <CodeBlock lang="text" code={`nexus-ai/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Chat.tsx
│       │   ├── Sidebar.tsx
│       │   ├── Login.tsx
│       │   ├── Welcome.tsx
│       │   └── MemorySearch.tsx
│       ├── pages/
│       │   ├── Documentation.tsx
│       │   └── ContactPage.tsx
│       └── utils/
│           └── thread.ts
└── backend/
    └── src/
        ├── controllers/
        │   ├── aiController.ts
        │   ├── threadController.ts
        │   ├── authController.ts
        │   └── memoryController.ts
        ├── models/
        │   ├── historyModels.ts
        │   ├── threadModel.ts
        │   ├── userModel.ts
        │   └── memoryModel.ts
        ├── middleware/
        │   └── auth.ts
        ├── utils/
        │   ├── aiClient.gemini.ts
        │   ├── embeddingUtils.ts
        │   └── memoryRetrieval.ts
        ├── routes/
        │   ├── aiRoutes.ts
        │   ├── authRoutes.ts
        │   └── memoryRoutes.ts
        └── server.ts`} />
              </div>
            </div>
          </section>

          {/* ── HOW IT WORKS ── */}
          <section id="how-it-works">
            <SectionHeading>How It Works</SectionHeading>

            <div className="space-y-6">
              {[
                {
                  title: "1. Authentication Flow",
                  steps: ["User submits email + password", "Server validates and issues JWT token", "Client stores token, accesses protected routes", "All API requests authenticated via Bearer token"],
                },
                {
                  title: "2. Conversation with Memory",
                  steps: ["New message received → generate vector embedding", "Atlas Vector Search finds semantically relevant past conversations", "Top-k memories retrieved and injected into prompt context", "Gemini generates response grounded in memory", "Response + new message stored as new memory embedding"],
                },
                {
                  title: "3. Memory Intelligence",
                  steps: ["Each message converted to numerical vector representation", "Cosine similarity used to score relevance against memory store", "RAG context enriches current prompt before AI processing", "Thread summaries auto-generated and titles semantically renamed"],
                },
              ].map((flow, i) => (
                <SpotlightCard key={i} className="p-5">
                  <h3 className="text-white text-sm font-semibold mb-4">{flow.title}</h3>
                  <ol className="space-y-2.5">
                    {flow.steps.map((step, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <span className="text-neutral-700 text-xs font-mono flex-shrink-0 mt-0.5 w-4">{String(j + 1).padStart(2, "0")}</span>
                        <span className="text-neutral-400 text-sm leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </SpotlightCard>
              ))}
            </div>
          </section>

          {/* ── API ENDPOINTS ── */}
          <section id="api">
            <SectionHeading>API Endpoints</SectionHeading>

            <div className="space-y-6">
              {[
                {
                  group: "AI & Chat",
                  endpoints: [
                    { verb: "POST", path: "/api/ai/query", desc: "Send prompt & receive AI response with memory context" },
                    { verb: "GET", path: "/api/ai/history", desc: "Retrieve thread message history" },
                    { verb: "GET", path: "/api/ai/threads", desc: "Get all user threads" },
                    { verb: "DELETE", path: "/api/ai/threads/:threadId", desc: "Delete thread and messages" },
                  ],
                },
                {
                  group: "Memory & Semantic Search",
                  endpoints: [
                    { verb: "POST", path: "/api/memory/search", desc: "Semantic search across all conversations" },
                    { verb: "POST", path: "/api/memory/query", desc: "Ask questions about past conversations" },
                    { verb: "POST", path: "/api/memory/summarize", desc: "Generate thread summaries" },
                    { verb: "GET", path: "/api/memory/stats", desc: "Get memory usage statistics" },
                  ],
                },
                {
                  group: "Authentication",
                  endpoints: [
                    { verb: "POST", path: "/api/auth/login", desc: "User login" },
                    { verb: "POST", path: "/api/auth/register", desc: "User registration" },
                  ],
                },
              ].map((group) => (
                <div key={group.group}>
                  <p className="text-neutral-500 text-xs uppercase tracking-widest mb-3">{group.group}</p>
                  <div className="rounded-2xl overflow-hidden" style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {group.endpoints.map((ep, i) => (
                      <div key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                        style={{ borderBottom: i < group.endpoints.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <span className="w-16 text-xs font-mono font-bold flex-shrink-0"
                          style={{ color: ep.verb === "POST" ? "#4ade80" : ep.verb === "DELETE" ? "#f87171" : "#60a5fa" }}>
                          {ep.verb}
                        </span>
                        <code className="text-neutral-300 font-mono text-xs flex-1">{ep.path}</code>
                        <span className="text-neutral-600 text-xs hidden sm:block">{ep.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── MEMORY SYSTEM ── */}
          <section id="memory">
            <SectionHeading>Memory System</SectionHeading>

            <div className="space-y-4 mb-6">
              <SpotlightCard className="p-5">
                <h3 className="text-white text-sm font-semibold mb-3">Semantic Memory Architecture</h3>
                <div className="space-y-2">
                  {[
                    { k: "Vector Embeddings", v: "Convert conversations to numerical representations using Google's embedding-001 model" },
                    { k: "Atlas Vector Search", v: "MongoDB's built-in semantic search with cosine similarity scoring" },
                    { k: "Relevance Scoring", v: "Top-k retrieval with configurable similarity thresholds" },
                  ].map((r) => (
                    <div key={r.k} className="flex gap-3">
                      <span className="text-neutral-500 text-xs w-40 flex-shrink-0 pt-0.5">{r.k}</span>
                      <span className="text-neutral-400 text-xs leading-relaxed">{r.v}</span>
                    </div>
                  ))}
                </div>
              </SpotlightCard>
            </div>

            <p className="text-neutral-500 text-sm mb-3">Memory query examples:</p>
            <CodeBlock lang="javascript" code={`// Search past conversations semantically
POST /api/memory/search
{
  "query": "Where did I discuss MongoDB vector search?",
  "userId": "user123",
  "limit": 5
}

// Ask about past chats
POST /api/memory/query
{
  "question": "What problems did I face while building this project?",
  "userId": "user123"
}`} />

            <p className="text-neutral-500 text-sm mt-6 mb-3">Debugging memory:</p>
            <CodeBlock lang="bash" code={`# Check memory statistics
curl -X GET http://localhost:5000/api/memory/stats \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Test semantic search
curl -X POST http://localhost:5000/api/memory/search \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{"query": "test query", "limit": 3}'`} />
          </section>

          {/* ── DEPLOYMENT ── */}
          <section id="deployment">
            <SectionHeading>Deployment</SectionHeading>

            <div className="space-y-8">
              <div>
                <h3 className="text-white text-sm font-semibold mb-3">Backend — Render / Railway / AWS</h3>
                <ol className="space-y-3 mb-4">
                  {["Push to GitHub", "Connect repo on your platform of choice", "Set build command: npm install", "Set start command: npm start"].map((s, i) => (
                    <li key={i} className="flex items-center gap-3 text-neutral-400 text-sm">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono flex-shrink-0"
                        style={{ background: "rgba(255,255,255,0.06)", color: "#737373" }}>{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
                <CodeBlock lang="env" code={`MONGO_URI=your_production_mongo_atlas_url
GEMINI_API_KEY=your_gemini_key
JWT_SECRET=your_production_secret
VECTOR_SEARCH_INDEX_NAME=conversation_embeddings
EMBEDDING_MODEL=embedding-001`} />
              </div>

              <div>
                <h3 className="text-white text-sm font-semibold mb-3">Frontend — Vercel / Netlify</h3>
                <ol className="space-y-3 mb-4">
                  {["Import your frontend repository", "Build settings auto-detected", "Set environment variable", "Deploy — auto-deploys on git push"].map((s, i) => (
                    <li key={i} className="flex items-center gap-3 text-neutral-400 text-sm">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono flex-shrink-0"
                        style={{ background: "rgba(255,255,255,0.06)", color: "#737373" }}>{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
                <CodeBlock lang="env" code={`VITE_API_URL=https://your-backend-url.com/api`} />
              </div>

              {/* Troubleshooting */}
              <div>
                <h3 className="text-white text-sm font-semibold mb-4">Common Issues</h3>
                <div className="space-y-3">
                  {[
                    { issue: "Vector Search not working", fix: "Verify MongoDB Atlas Vector Search is enabled and the index is created with correct dimensions." },
                    { issue: "Memory retrieval empty", fix: "Check embedding generation is working. Verify similarity thresholds are appropriate (try 0.7)." },
                    { issue: "Auth failures", fix: "Verify JWT_SECRET matches between frontend and backend. Check token expiration settings." },
                    { issue: "AI service errors", fix: "Validate GEMINI_API_KEY is correct and check API rate limits on your Google Cloud console." },
                  ].map((t) => (
                    <SpotlightCard key={t.issue} className="p-4">
                      <p className="text-white text-xs font-semibold mb-1">{t.issue}</p>
                      <p className="text-neutral-500 text-xs leading-relaxed">{t.fix}</p>
                    </SpotlightCard>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-8 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-neutral-700 text-xs">
              NEXUS AI · MIT License · Built with React, Node.js, MongoDB Atlas, Gemini AI
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
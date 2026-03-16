# NEXUS AI

<div align="center">

![NEXUS AI](https://img.shields.io/badge/NEXUS-AI-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-2.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-Full_Stack-3178C6?style=for-the-badge&logo=typescript)

**Production-grade AI chat platform with long-term memory, real-time web search, and code execution**

[Live Demo](#) • [Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [API](#-api-endpoints)

</div>

---

> **Built as a full-stack portfolio project** demonstrating production AI integration, RAG architecture, LangChain-style tool agents, OAuth, structured logging, and deployment on Render.

---

## 📸 Preview

### Chat Interface
![Chat Interface](https://github.com/jaycodes2/NEXUS_AI/blob/main/chat_layout.png?raw=true)

### Welcome Page
![Welcome Page](https://github.com/jaycodes2/NEXUS_AI/blob/main/welcome_page.png?raw=true)

### Login / Signup
![Login Page](https://github.com/jaycodes2/NEXUS_AI/blob/main/login_page.png?raw=true)

### Mobile Responsive
![Mobile View](https://github.com/jaycodes2/NEXUS_AI/blob/main/mobile_responsiveness.png?raw=true)

---

## ✨ Features

### 🤖 AI Agents
- **Web Search Agent** — Gemini autonomously calls Tavily Search API for real-time information when needed
- **Code Interpreter Agent** — Executes JavaScript, TypeScript, and Python in a sandboxed Node.js `vm` environment and returns real stdout/stderr
- **Tool orchestration** — Multi-round tool calling loop with parallel execution and status indicators streamed to the UI

### 🧠 Long-Term Memory & RAG
- **Vector embeddings** on every message using Gemini's embedding model
- **MongoDB Atlas Vector Search** for semantic retrieval across all past conversations
- **Dual-path search** — queries both `promptEmbedding` and `replyEmbedding` in parallel, deduplicates, and ranks by cosine similarity score
- **RAG-augmented prompts** — top 5 relevant memories injected into every new request
- **Memory Search UI** — dedicated page to semantically query past conversations in natural language

### ⚡ Streaming & Performance
- **Server-Sent Events (SSE)** with `flushHeaders()` for zero-latency stream start
- **rAF-batched rendering** — chunks buffered and flushed at 60fps to avoid re-rendering on every token
- **Parallel pre-flight** — API log, thread upsert, history fetch, and RAG all fire simultaneously before streaming starts
- **SSE retry with exponential backoff** — auto-reconnects on network drop, shows inline status
- **Thread switch skeleton** — cancels in-flight stream, shows animated skeleton while loading new history

### 📎 File Upload
- Attach PDFs, images (JPG/PNG/WebP), and code files directly to messages
- Converted to base64 in the browser — never stored on the server
- Sent as Gemini multipart messages for native document and image understanding

### 🔐 Authentication
- **JWT** with 7-day expiry
- **Google OAuth** via Passport.js — account linking (existing email users can link Google, OAuth users blocked from password login with clear error)
- **bcrypt** with configurable salt rounds (8 for production performance)
- Proper error messages for all failure cases (wrong password, email not found, OAuth-only account)

### 🏗️ Production Infrastructure
- **Pino structured logging** — JSON in production (Render-native), pretty-printed in dev, scoped child loggers per module
- **express-rate-limit** — 20/min on auth (brute force), 60/min on AI queries, 30/min on memory search
- **Health check endpoint** at `/api/health` for UptimeRobot monitoring
- **Global error handler** with full stack trace logging
- **Export conversations** as Markdown or PDF from both the topbar and sidebar thread menu

---

## 🛠 Tech Stack

### Frontend
| | |
|---|---|
| React 18 + TypeScript | Component architecture |
| Tailwind CSS v4 | Styling |
| Framer Motion | Animations |
| React Router (HashRouter) | Client-side routing |
| ReactMarkdown + remark-gfm | Markdown rendering |
| react-syntax-highlighter | Code block highlighting |
| shadcn/ui | UI primitives |

### Backend
| | |
|---|---|
| Node.js + Express + TypeScript | Server framework |
| MongoDB + Mongoose | Database |
| MongoDB Atlas Vector Search | Semantic memory retrieval |
| Pino | Structured logging |
| Passport.js | OAuth strategy |
| bcrypt + JWT | Authentication |
| express-rate-limit | Rate limiting |

### AI
| | |
|---|---|
| Google Gemini 2.0 Flash | Primary conversation model |
| Gemini Embeddings | Vector embedding generation |
| Tavily Search API | Real-time web search agent |
| Node.js `vm` module | JavaScript/TypeScript sandbox |
| Python `child_process` | Python execution sandbox |

## 🏛 Architecture

### RAG Pipeline
![RAG Pipeline](https://github.com/jaycodes2/NEXUS_AI/blob/main/rag_pipeline.png?raw=true)

### Tool Agent Loop
![Tool Agent Loop](https://github.com/jaycodes2/NEXUS_AI/blob/main/tool_flow.png?raw=true)

### Auth Flow
![Auth Flow](https://github.com/jaycodes2/NEXUS_AI/blob/main/auth_flow.png?raw=true)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas cluster with Vector Search enabled
- Google Gemini API key
- Tavily API key (for web search agent)

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

`.env`:
```env
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
TAVILY_API_KEY=your_tavily_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
BCRYPT_ROUNDS=8
PORT=5000
```

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

`.env`:
```env
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev
```

### MongoDB Atlas Vector Search Index

Create an index named `history_vector_index` on the `histories` collection:

```json
{
  "fields": [
    { "type": "vector", "path": "promptEmbedding", "numDimensions": 768, "similarity": "cosine" },
    { "type": "vector", "path": "replyEmbedding", "numDimensions": 768, "similarity": "cosine" },
    { "type": "filter", "path": "userId" }
  ]
}
```

---

## 📁 Project Structure

```
nexus-ai/
├── frontend/src/
│   ├── components/
│   │   ├── chat.tsx          # SSE streaming, rAF batching, file upload
│   │   ├── Sidebar.tsx       # Thread list, search, export
│   │   ├── Login.tsx         # Email + Google OAuth
│   │   └── OAuthCallback.tsx # Handles Google redirect
│   ├── pages/
│   │   ├── MemorySearch.tsx  # Semantic memory query UI
│   │   └── Documentation.tsx
│   └── utils/
│       ├── useExport.ts      # Markdown + PDF export
│       └── thread.ts
│
└── backend/src/
    ├── controllers/
    │   ├── aiController.ts   # SSE stream, RAG, parallel pre-flight
    │   └── memoryController.ts
    ├── utils/
    │   ├── aiClient.gemini.ts  # Tool agent loop, file handling
    │   ├── tools/
    │   │   ├── webSearch.ts    # Tavily integration
    │   │   └── codeInterpreter.ts # vm sandbox + Python
    │   ├── rag.ts              # Dual-path vector search
    │   ├── passport.ts         # Google OAuth strategy
    │   ├── rateLimiter.ts      # Per-route limits
    │   └── logger.ts           # Pino scoped loggers
    └── routes/
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Email login → JWT |
| `POST` | `/api/auth/register` | Register → JWT |
| `GET` | `/api/auth/google` | Initiate Google OAuth |
| `GET` | `/api/auth/google/callback` | Google OAuth callback |
| `POST` | `/api/ai/query` | Chat with RAG + agents (SSE) |
| `GET` | `/api/ai/history` | Thread message history |
| `GET` | `/api/ai/threads` | All user threads |
| `DELETE` | `/api/ai/threads/:threadId` | Delete thread |
| `POST` | `/api/memory/ask` | Semantic memory query |
| `GET` | `/api/health` | Health check |

---

## 🚢 Deployment

Backend on **Render**, frontend on **Vercel/Netlify**.

Set these environment variables on Render:
```env
GOOGLE_CALLBACK_URL=https://your-backend.onrender.com/api/auth/google/callback
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
```

Add `https://your-backend.onrender.com/api/auth/google/callback` to your Google OAuth authorized redirect URIs.

Monitor with [UptimeRobot](https://uptimerobot.com) pinging `/api/health` every 5 minutes to prevent Render free tier cold starts.

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

<div align="center">

**React • Node.js • TypeScript • MongoDB Atlas • Gemini AI • Tailwind CSS**

</div>
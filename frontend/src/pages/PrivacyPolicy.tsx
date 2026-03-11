import { useRef } from "react";
import { motion } from "framer-motion";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-white font-semibold text-base mb-3 tracking-tight">{title}</h2>
      <div className="text-neutral-500 text-sm leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function PrivacyPolicy({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen overflow-y-auto" style={{ background: "#000", color: "#fff" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-10 px-6 h-14 flex items-center gap-4"
        style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <button onClick={onBack} className="flex items-center gap-2 text-neutral-500 hover:text-white text-sm transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <div className="w-px h-4 bg-white/10" />
        <span className="text-neutral-500 text-sm">Privacy Policy</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-neutral-400 mb-8">
            Last updated: March 2026
          </div>
          <h1 className="text-white font-bold tracking-tight mb-3"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)", letterSpacing: "-0.03em" }}>
            Privacy Policy
          </h1>
          <p className="text-neutral-500 text-sm mb-12 leading-relaxed">
            This policy explains how NEXUS AI collects, uses, and protects your information when you use our platform.
          </p>

          <div className="w-full h-px mb-12" style={{ background: "rgba(255,255,255,0.06)" }} />

          <Section title="1. Information We Collect">
            <p>We collect the following types of information when you use NEXUS AI:</p>
            <ul className="space-y-1.5 pl-4">
              {[
                "Account information — email address and hashed password used for authentication.",
                "Conversation data — messages, AI responses, and thread metadata stored to power memory features.",
                "Vector embeddings — semantic representations of your conversations stored in MongoDB Atlas.",
                "Usage data — basic analytics about how you interact with the platform.",
              ].map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-white/20 flex-shrink-0 mt-2" />
                  {i}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>Your data is used exclusively to provide and improve the NEXUS AI service:</p>
            <ul className="space-y-1.5 pl-4">
              {[
                "To authenticate your account and maintain secure sessions via JWT.",
                "To power the persistent memory system — retrieving relevant past conversations using vector search.",
                "To generate AI responses grounded in your conversation history via RAG.",
                "To auto-generate thread titles and summaries using AI.",
              ].map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-white/20 flex-shrink-0 mt-2" />
                  {i}
                </li>
              ))}
            </ul>
            <p>We do not sell, rent, or share your personal data or conversation history with third parties.</p>
          </Section>

          <Section title="3. Data Storage & Security">
            <p>All data is stored in MongoDB Atlas with strict access controls. Passwords are hashed and never stored in plain text. JWT tokens are used for session management with configurable expiration.</p>
            <p>Vector embeddings are stored in a dedicated collection with index-level access controls. Conversations are isolated per user and never cross-referenced between accounts.</p>
          </Section>

          <Section title="4. Third-Party Services">
            <p>NEXUS AI uses the following third-party services:</p>
            <ul className="space-y-1.5 pl-4">
              {[
                "Google Gemini API — for AI response generation and vector embeddings. Your messages are sent to Google's API for processing.",
                "MongoDB Atlas — for database storage and vector search infrastructure.",
              ].map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-white/20 flex-shrink-0 mt-2" />
                  {i}
                </li>
              ))}
            </ul>
            <p>Each of these services has their own privacy policies which govern how they handle data sent to them.</p>
          </Section>

          <Section title="5. Data Retention">
            <p>Your conversation data and embeddings are retained as long as your account is active. You can delete individual threads at any time from the sidebar. Account deletion removes all associated data permanently.</p>
          </Section>

          <Section title="6. Your Rights">
            <p>You have the right to access, correct, or delete your personal data at any time. To request account deletion or a data export, contact us directly.</p>
          </Section>

          <Section title="7. Contact">
            <p>If you have questions about this privacy policy or how your data is handled, please reach out via the contact page.</p>
          </Section>
        </motion.div>
      </div>
    </div>
  );
}

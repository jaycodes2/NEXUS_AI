import { motion } from "framer-motion";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-white font-semibold text-base mb-3 tracking-tight">{title}</h2>
      <div className="text-neutral-500 text-sm leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function TermsOfService({ onBack }: { onBack: () => void }) {
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
        <span className="text-neutral-500 text-sm">Terms of Service</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-neutral-400 mb-8">
            Effective: March 2026
          </div>
          <h1 className="text-white font-bold tracking-tight mb-3"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)", letterSpacing: "-0.03em" }}>
            Terms of Service
          </h1>
          <p className="text-neutral-500 text-sm mb-12 leading-relaxed">
            By using NEXUS AI, you agree to these terms. Please read them carefully before creating an account.
          </p>

          <div className="w-full h-px mb-12" style={{ background: "rgba(255,255,255,0.06)" }} />

          <Section title="1. Acceptance of Terms">
            <p>By accessing or using NEXUS AI, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.</p>
          </Section>

          <Section title="2. Use of the Service">
            <p>NEXUS AI is provided for personal and professional use. You agree not to:</p>
            <ul className="space-y-1.5 pl-4">
              {[
                "Use the service for any unlawful purpose or in violation of any regulations.",
                "Attempt to reverse-engineer, hack, or compromise the platform's security.",
                "Use automated scripts to abuse the API or overload the system.",
                "Submit content that is harmful, abusive, or violates the rights of others.",
                "Share your account credentials with third parties.",
              ].map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-white/20 flex-shrink-0 mt-2" />
                  {i}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="3. Your Account">
            <p>You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activity that occurs under your account.</p>
            <p>We reserve the right to suspend or terminate accounts that violate these terms without prior notice.</p>
          </Section>

          <Section title="4. Your Content">
            <p>You retain ownership of all content you submit to NEXUS AI. By using the platform, you grant us a limited licence to store and process your content solely to provide the service — including powering the memory and RAG systems.</p>
            <p>We do not use your conversation data to train AI models or share it with third parties beyond what is described in our Privacy Policy.</p>
          </Section>

          <Section title="5. AI-Generated Content">
            <p>NEXUS AI uses Google Gemini to generate responses. AI-generated content may not always be accurate, complete, or appropriate. You are responsible for verifying any AI output before relying on it for important decisions.</p>
            <p>We are not liable for decisions made based on AI-generated responses.</p>
          </Section>

          <Section title="6. Service Availability">
            <p>We aim to keep NEXUS AI available at all times but do not guarantee uninterrupted access. We may perform maintenance, updates, or suspend the service at any time without notice.</p>
          </Section>

          <Section title="7. Limitation of Liability">
            <p>To the maximum extent permitted by law, NEXUS AI is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
          </Section>

          <Section title="8. Changes to Terms">
            <p>We may update these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms. We will update the effective date above when changes are made.</p>
          </Section>

          <Section title="9. Contact">
            <p>For questions about these terms, please reach out via the contact page.</p>
          </Section>
        </motion.div>
      </div>
    </div>
  );
}

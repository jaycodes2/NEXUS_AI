import { motion } from "framer-motion";

export default function License({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen overflow-y-auto" style={{ background: "#000", color: "#fff" }}>
      <div className="sticky top-0 z-10 px-6 h-14 flex items-center gap-4"
        style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <button onClick={onBack} className="flex items-center gap-2 text-neutral-500 hover:text-white text-sm transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <div className="w-px h-4 bg-white/10" />
        <span className="text-neutral-500 text-sm">License</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-neutral-400 mb-8">
            MIT License
          </div>
          <h1 className="text-white font-bold tracking-tight mb-3"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)", letterSpacing: "-0.03em" }}>
            License
          </h1>
          <p className="text-neutral-500 text-sm mb-12 leading-relaxed">
            NEXUS AI is open source and released under the MIT License.
          </p>

          <div className="w-full h-px mb-12" style={{ background: "rgba(255,255,255,0.06)" }} />

          <div className="rounded-2xl p-6 mb-10" style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)" }}>
            <pre className="text-neutral-400 text-sm leading-loose font-mono whitespace-pre-wrap">
{`MIT License

Copyright (c) 2026 NEXUS AI

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.`}
            </pre>
          </div>

          <div className="space-y-4 text-neutral-500 text-sm leading-relaxed">
            <p>This means you are free to:</p>
            <ul className="space-y-2 pl-4">
              {[
                "Use NEXUS AI for personal or commercial projects.",
                "Modify the source code to suit your needs.",
                "Distribute your own versions of the software.",
                "Include it in larger projects, open source or proprietary.",
              ].map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {i}
                </li>
              ))}
            </ul>
            <p className="pt-2">The only requirement is that the original copyright notice and license text are included in any copies or substantial portions of the software.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

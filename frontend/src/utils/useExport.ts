const API_URL = (import.meta as any).env?.VITE_API_URL;

export interface Message {
  prompt: string;
  reply: string;
  fileName?: string;
  createdAt?: string;
}

// ── Markdown export ───────────────────────────────────────────────────────────

export function exportMarkdown(messages: Message[], threadName = "conversation") {
  const lines: string[] = [
    `# ${threadName}`,
    `_Exported from NEXUS AI on ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}_`,
    "",
    "---",
    "",
  ];

  messages.forEach((m, i) => {
    lines.push(`## Message ${i + 1}`);
    lines.push("");

    // User prompt
    lines.push("**You**");
    if (m.fileName) lines.push(`> 📎 Attached: \`${m.fileName}\``);
    lines.push("");
    lines.push(m.prompt);
    lines.push("");

    // AI reply
    lines.push("**NEXUS**");
    lines.push("");
    lines.push(m.reply || "_No response_");
    lines.push("");
    lines.push("---");
    lines.push("");
  });

  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  triggerDownload(blob, `${sanitizeFilename(threadName)}.md`);
}

// ── PDF export ────────────────────────────────────────────────────────────────

export function exportPDF(messages: Message[], threadName = "conversation") {
  const html = buildPDFHtml(messages, threadName);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });

  // Open in new tab — user prints to PDF via browser's print dialog (Ctrl+P → Save as PDF)
  // This works on all browsers with zero dependencies
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");

  if (win) {
    win.onload = () => {
      setTimeout(() => {
        win.print();
        URL.revokeObjectURL(url);
      }, 500);
    };
  } else {
    // Popup blocked — fallback: download the HTML file
    triggerDownload(blob, `${sanitizeFilename(threadName)}.html`);
    URL.revokeObjectURL(url);
  }
}

// ── Fetch messages from backend (for sidebar export) ─────────────────────────

export async function fetchAndExport(
  threadId: string,
  threadName: string,
  format: "markdown" | "pdf"
) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/ai/history?threadId=${threadId}`, {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });

  if (!res.ok) throw new Error("Failed to fetch conversation history");
  const messages: Message[] = await res.json();

  if (format === "markdown") exportMarkdown(messages, threadName);
  else exportPDF(messages, threadName);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9\-_\s]/gi, "").trim().replace(/\s+/g, "-").slice(0, 60) || "nexus-conversation";
}

function buildPDFHtml(messages: Message[], threadName: string): string {
  const escapeHtml = (str: string) =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // Convert basic markdown to HTML for PDF rendering
  const renderMarkdown = (text: string): string => {
    return text
      .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
        `<pre><code class="lang-${lang}">${escapeHtml(code.trim())}</code></pre>`
      )
      .replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>\n?)+/g, (list) => `<ul>${list}</ul>`)
      .replace(/\n\n/g, "</p><p>")
      .replace(/^(?!<[hupoli])/gm, "")
      .trim();
  };

  const messagesHtml = messages.map((m, i) => `
    <div class="message">
      <div class="user-block">
        <div class="role-label user-label">You</div>
        ${m.fileName ? `<div class="file-badge">📎 ${escapeHtml(m.fileName)}</div>` : ""}
        <div class="message-text">${escapeHtml(m.prompt).replace(/\n/g, "<br>")}</div>
      </div>
      <div class="ai-block">
        <div class="role-label ai-label">NEXUS</div>
        <div class="message-text">${renderMarkdown(m.reply || "")}</div>
      </div>
      ${i < messages.length - 1 ? '<hr class="divider">' : ""}
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(threadName)} — NEXUS AI</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 13px;
      line-height: 1.7;
      color: #1a1a1a;
      background: #fff;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e5e5e5;
    }
    .logo {
      width: 32px; height: 32px;
      background: #1d4ed8;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 14px;
    }
    .header-title { font-size: 18px; font-weight: 700; }
    .header-meta { font-size: 11px; color: #888; margin-top: 2px; }
    .message { margin-bottom: 24px; }
    .user-block { margin-bottom: 12px; }
    .ai-block { padding-left: 16px; border-left: 3px solid #e5e5e5; }
    .role-label {
      font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.08em;
      margin-bottom: 4px;
    }
    .user-label { color: #1d4ed8; }
    .ai-label { color: #6b7280; }
    .file-badge {
      display: inline-block;
      font-size: 11px; color: #92400e;
      background: #fef3c7; border: 1px solid #fde68a;
      border-radius: 4px; padding: 1px 8px;
      margin-bottom: 6px;
    }
    .message-text { color: #1a1a1a; }
    pre {
      background: #f4f4f5; border-radius: 6px;
      padding: 12px; overflow-x: auto;
      margin: 8px 0; font-size: 12px;
      border: 1px solid #e4e4e7;
    }
    code { font-family: "SF Mono", "Fira Code", monospace; font-size: 12px; }
    p code { background: #f4f4f5; padding: 1px 5px; border-radius: 3px; }
    h1,h2,h3 { margin: 12px 0 4px; font-weight: 600; }
    h1 { font-size: 16px; } h2 { font-size: 14px; } h3 { font-size: 13px; }
    ul { padding-left: 20px; margin: 6px 0; }
    li { margin: 2px 0; }
    strong { font-weight: 600; }
    .divider { border: none; border-top: 1px solid #f0f0f0; margin: 24px 0; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 11px; color: #aaa; text-align: center; }
    @media print {
      body { padding: 20px; }
      .message { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">N</div>
    <div>
      <div class="header-title">${escapeHtml(threadName)}</div>
      <div class="header-meta">Exported from NEXUS AI · ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })} · ${messages.length} message${messages.length !== 1 ? "s" : ""}</div>
    </div>
  </div>

  ${messagesHtml}

  <div class="footer">Generated by NEXUS AI</div>
</body>
</html>`;
}

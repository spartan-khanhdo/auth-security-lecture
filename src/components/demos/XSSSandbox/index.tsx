"use client";

import { useState, useCallback } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import DemoFrame from "@/components/demos/_shared/DemoFrame";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

const SAMPLE_PAYLOADS = [
  { label: "<script> tag", value: "<script>alert('XSS')</script>" },
  { label: "img onerror", value: "<img src=x onerror=alert(1)>" },
  { label: "svg onload", value: "<svg onload=alert(document.domain)>" },
];

function makeUnsanitizedDoc(input: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: system-ui; font-size: 13px; padding: 12px; background: #1a1a2e; color: #edecf4; margin: 0; }
  .tag { font-size: 11px; color: #ff6b7a; margin-bottom: 8px; font-weight: 700; }
  .output { background: #25263a; border-radius: 8px; padding: 10px; border: 1px solid #2e2f47; min-height: 40px; }
</style>
</head>
<body>
<div class="tag">UNSANITIZED — scripts will execute</div>
<div class="output">${input}</div>
</body>
</html>`;
}

function makeSanitizedDoc(input: string): string {
  const safe = escapeHtml(input);
  return `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: system-ui; font-size: 13px; padding: 12px; background: #1a1a2e; color: #edecf4; margin: 0; }
  .tag { font-size: 11px; color: #46d6a0; margin-bottom: 8px; font-weight: 700; }
  .output { background: #25263a; border-radius: 8px; padding: 10px; border: 1px solid #2e2f47; min-height: 40px; word-break: break-word; }
</style>
</head>
<body>
<div class="tag">SANITIZED — rendered as literal text</div>
<div class="output">${safe}</div>
</body>
</html>`;
}

export default function XSSSandbox() {
  const [input, setInput] = useState("");

  const handleReset = useCallback(() => setInput(""), []);

  const loadSample = useCallback((value: string) => setInput(value), []);

  return (
    <DemoFrame
      title="XSS Sandbox"
      subtitle="Type an HTML payload to see it execute unsanitized vs rendered safely"
      onReset={input ? handleReset : undefined}
      footerNote="Both iframes use sandbox='allow-scripts' without allow-same-origin, so injected scripts run in a null origin and cannot reach window.parent or the parent page's cookies. In a real app, never inject user content without escaping it."
    >
      {/* Input */}
      <div className="flex flex-col gap-2 mb-3">
        <label className="text-xs font-semibold text-[var(--text-faint)]">
          HTML input (paste any payload)
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="<script>alert('xss')</script>"
          spellCheck={false}
          rows={3}
          className="font-mono text-sm bg-[var(--code-bg)] border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-[var(--text)] placeholder:text-[var(--text-faint)] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
      </div>

      {/* Sample payloads */}
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="text-xs text-[var(--text-faint)] self-center">Samples:</span>
        {SAMPLE_PAYLOADS.map((s) => (
          <button
            key={s.label}
            onClick={() => loadSample(s.value)}
            className="text-xs px-2.5 py-1 rounded-lg bg-[var(--red)]/10 border border-[var(--red)]/20 text-[var(--red)] hover:bg-[var(--red)]/20 transition-colors cursor-pointer font-mono"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Iframes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unsanitized */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--red)]">
            <AlertTriangle size={13} />
            Unsanitized (innerHTML / server-side template injection)
          </div>
          <iframe
            key={`unsafe-${input}`}
            srcDoc={makeUnsanitizedDoc(input)}
            sandbox="allow-scripts"
            className="w-full rounded-xl border border-[var(--red)]/30 bg-[var(--code-bg)]"
            style={{ height: 130 }}
            title="Unsanitized XSS demo"
          />
          <p className="text-xs text-[var(--text-faint)]">
            User content is injected directly into the DOM. Scripts execute, images trigger event handlers, and SVG onload fires.
          </p>
        </div>

        {/* Sanitized */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--green)]">
            <ShieldCheck size={13} />
            Sanitized (HTML-escaped before rendering)
          </div>
          <iframe
            key={`safe-${input}`}
            srcDoc={makeSanitizedDoc(input)}
            sandbox="allow-scripts"
            className="w-full rounded-xl border border-[var(--green)]/30 bg-[var(--code-bg)]"
            style={{ height: 130 }}
            title="Sanitized XSS demo"
          />
          <p className="text-xs text-[var(--text-faint)]">
            All HTML special characters are escaped to their entity equivalents.
            The payload renders as visible text — not executable markup.
          </p>
        </div>
      </div>

      {/* Escape preview */}
      {input && (
        <div className="mt-4 flex flex-col gap-1">
          <div className="text-xs font-mono font-bold text-[var(--text-faint)]">
            escapeHtml() output:
          </div>
          <div className="font-mono text-xs bg-[var(--code-bg)] border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-[var(--green)] break-all">
            {escapeHtml(input)}
          </div>
        </div>
      )}
    </DemoFrame>
  );
}

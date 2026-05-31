"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { CheckCircle, XCircle, Shield } from "lucide-react";
import DemoFrame from "@/components/demos/_shared/DemoFrame";
import {
  makeSameOriginDoc,
  makeCrossSiteDoc,
  CSRF_MESSAGE_TYPE,
  type CSRFMessage,
} from "./iframeDocs";

type SameSite = "None" | "Lax" | "Strict";

interface AttemptResult {
  iframeId: "same-origin" | "cross-site";
  cookieSent: boolean;
  timestamp: number;
}

const SAMESITE_DESCRIPTIONS: Record<SameSite, string> = {
  None: "Cookie is sent with all requests, including cross-site POST. The browser attaches the cookie without restriction — CSRF succeeds.",
  Lax: "Cookie is sent for same-site requests and cross-site GET navigations, but NOT cross-site POST. The attacker's form submit is blocked.",
  Strict: "Cookie is only sent for same-site requests. Any cross-site request — GET or POST — arrives without the cookie. Maximum protection.",
};

export default function CSRFSandbox() {
  const [sameSite, setSameSite] = useState<SameSite>("None");
  const [attempts, setAttempts] = useState<AttemptResult[]>([]);
  const iframeSourceRef = useRef<EventSource | null>(null);

  const handleReset = useCallback(() => {
    setAttempts([]);
  }, []);

  // Listen for postMessage from iframes
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // We accept from any origin because sandbox="allow-scripts" gives the
      // iframe a null origin — we verify by checking message shape instead.
      if (
        event.data &&
        typeof event.data === "object" &&
        event.data.type === CSRF_MESSAGE_TYPE
      ) {
        const msg = event.data as CSRFMessage;
        setAttempts((prev) => [
          ...prev,
          {
            iframeId: msg.iframeId,
            cookieSent: msg.cookieSent,
            timestamp: Date.now(),
          },
        ]);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // We don't actually use this ref — suppress warning
  void iframeSourceRef;

  const sameOriginDoc = makeSameOriginDoc(sameSite);
  const crossSiteDoc = makeCrossSiteDoc(sameSite);

  return (
    <DemoFrame
      title="CSRF Sandbox"
      subtitle="Change SameSite and click the form buttons to see when cookies are blocked"
      onReset={attempts.length > 0 ? handleReset : undefined}
      footerNote="SameSite=Lax or Strict prevents cross-site POST from carrying session cookies — defending against CSRF. SameSite=None requires Secure and makes the cookie fully cross-site accessible."
    >
      {/* SameSite selector */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--text-faint)]">
          Set-Cookie: session=abc; SameSite=
        </div>
        <div className="flex gap-2">
          {(["None", "Lax", "Strict"] as SameSite[]).map((s) => (
            <button
              key={s}
              onClick={() => { setSameSite(s); setAttempts([]); }}
              className={[
                "flex-1 text-sm font-semibold px-3 py-2 rounded-xl border transition-all cursor-pointer",
                sameSite === s
                  ? s === "None"
                    ? "bg-[var(--red)]/15 border-[var(--red)]/40 text-[var(--red)]"
                    : s === "Lax"
                    ? "bg-[var(--amber)]/15 border-[var(--amber)]/40 text-[var(--amber)]"
                    : "bg-[var(--green)]/15 border-[var(--green)]/40 text-[var(--green)]"
                  : "bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-dim)] hover:text-[var(--text)]",
              ].join(" ")}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--text-dim)] leading-relaxed">
          {SAMESITE_DESCRIPTIONS[sameSite]}
        </p>
      </div>

      {/* Iframes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Shield size={13} className="text-[var(--green)]" />
            <span className="text-xs font-semibold text-[var(--text-dim)]">
              Same-origin page (bank.example)
            </span>
          </div>
          <iframe
            key={`same-${sameSite}`}
            srcDoc={sameOriginDoc}
            sandbox="allow-scripts"
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--code-bg)]"
            style={{ height: 160 }}
            title="Same-origin CSRF form"
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <XCircle size={13} className="text-[var(--red)]" />
            <span className="text-xs font-semibold text-[var(--text-dim)]">
              Cross-site attacker page (evil.example)
            </span>
          </div>
          <iframe
            key={`cross-${sameSite}`}
            srcDoc={crossSiteDoc}
            sandbox="allow-scripts"
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--code-bg)]"
            style={{ height: 160 }}
            title="Cross-site CSRF form"
          />
        </div>
      </div>

      {/* Results */}
      {attempts.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--text-faint)] mb-1">
            Transfer attempts
          </div>
          {attempts.map((a, i) => (
            <div
              key={i}
              className={[
                "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm",
                a.cookieSent
                  ? "bg-[var(--red)]/10 border-[var(--red)]/30 text-[var(--text)]"
                  : "bg-[var(--green)]/10 border-[var(--green)]/30 text-[var(--text)]",
              ].join(" ")}
            >
              {a.cookieSent ? (
                <XCircle size={16} className="flex-none text-[var(--red)]" />
              ) : (
                <CheckCircle size={16} className="flex-none text-[var(--green)]" />
              )}
              <span className="font-medium capitalize">
                {a.iframeId.replace("-", " ")} form:
              </span>
              <span className={a.cookieSent ? "text-[var(--red)] font-semibold" : "text-[var(--green)] font-semibold"}>
                {a.cookieSent ? "cookie sent — CSRF succeeds" : "cookie blocked — CSRF prevented"}
              </span>
            </div>
          ))}
        </div>
      )}

      {attempts.length === 0 && (
        <div className="text-xs text-[var(--text-faint)] text-center py-4">
          Click a Submit / Transfer button inside either iframe to see the result.
        </div>
      )}
    </DemoFrame>
  );
}

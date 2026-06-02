"use client"; // uses useState, useEffect, framer-motion

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import DemoFrame from "@/components/demos/_shared/DemoFrame";

// ── Types ──────────────────────────────────────────────────────────────────

type From = "system" | "user";

interface ChatMsg {
  id: number;
  from: From;
  text: string;
}

interface ResultMsg {
  success: boolean;
  headline: string;
  detail: string;
}

interface PanelState {
  chats: ChatMsg[];
  result: ResultMsg | null;
}

type PanelKey = "authn" | "authz";

type TimelineEvent =
  | { at: number; panel: PanelKey; kind: "chat"; from: From; text: string }
  | {
      at: number;
      panel: PanelKey;
      kind: "result";
      success: boolean;
      headline: string;
      detail: string;
    };

// ── Timeline ───────────────────────────────────────────────────────────────

const TIMELINE: TimelineEvent[] = [
  { at: 400,  panel: "authn", kind: "chat",   from: "system", text: "Who are you?" },
  { at: 1050, panel: "authn", kind: "chat",   from: "user",   text: "truc@c0x12c.com" },
  { at: 1800, panel: "authn", kind: "chat",   from: "system", text: "Password?" },
  { at: 2500, panel: "authn", kind: "chat",   from: "user",   text: "••••••••" },
  { at: 3200, panel: "authn", kind: "chat",   from: "system", text: "OTP code? 📱" },
  { at: 3900, panel: "authn", kind: "chat",   from: "user",   text: "8 4 7  2 9 1" },
  {
    at: 4850,
    panel: "authn",
    kind: "result",
    success: true,
    headline: "Authenticated ✅",
    detail: "Identity confirmed — Welcome, Truc.",
  },
  { at: 5750, panel: "authz", kind: "chat",   from: "system", text: "DELETE /api/users/42" },
  { at: 6450, panel: "authz", kind: "chat",   from: "system", text: "Checking Truc's role…" },
  { at: 7150, panel: "authz", kind: "chat",   from: "system", text: "Role assigned: viewer 👁️" },
  {
    at: 8050,
    panel: "authz",
    kind: "result",
    success: false,
    headline: "Access denied ❌",
    detail: "Viewers cannot delete users.",
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function emptyPanels(): Record<PanelKey, PanelState> {
  return {
    authn: { chats: [], result: null },
    authz: { chats: [], result: null },
  };
}

// ── Root component ─────────────────────────────────────────────────────────

export default function AuthNAuthZAnimator() {
  const [panels, setPanels] = useState<Record<PanelKey, PanelState>>(emptyPanels);
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    TIMELINE.forEach((event, idx) => {
      const timer = setTimeout(() => {
        setPanels((prev) => {
          const updated: PanelState = { ...prev[event.panel] };
          if (event.kind === "chat") {
            updated.chats = [
              ...updated.chats,
              { id: idx, from: event.from, text: event.text },
            ];
          } else {
            updated.result = {
              success: event.success,
              headline: event.headline,
              detail: event.detail,
            };
          }
          return { ...prev, [event.panel]: updated };
        });
      }, event.at);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [runKey]);

  const handleReset = useCallback(() => {
    setPanels(emptyPanels());
    setRunKey((k) => k + 1);
  }, []);

  const authnDone = panels.authn.result !== null;

  return (
    <DemoFrame
      title="AuthN → AuthZ in Action"
      onReset={handleReset}
      footerNote="AuthN establishes who you are; AuthZ decides what you can do — always in that order."
    >
      <div className="space-y-2">
        {/* AuthN panel — always visible */}
        <AnimPanel
          label="🔐 Authentication (AuthN)"
          state={panels.authn}
          accentColor="teal"
        />

        {/* Connector — appears once AuthN resolves */}
        <AnimatePresence>
          {authnDone && (
            <motion.div
              key="connector"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex items-center gap-2 origin-left"
            >
              <div className="flex-1 h-px bg-[var(--border-subtle)]" />
              <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--text-faint)]">
                then →
              </span>
              <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* AuthZ panel — slides in once AuthN resolves */}
        <AnimatePresence>
          {authnDone && (
            <motion.div
              key="authz-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            >
              <AnimPanel
                label="🛡️ Authorization (AuthZ)"
                state={panels.authz}
                accentColor="violet"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DemoFrame>
  );
}

// ── AnimPanel ──────────────────────────────────────────────────────────────

interface AnimPanelProps {
  label: string;
  state: PanelState;
  accentColor: "teal" | "violet";
}

const ACCENT = {
  teal: {
    border:     "border-teal-500/30",
    header:     "bg-teal-500/[0.07]",
    dot:        "bg-teal-400",
    resultCard: "bg-emerald-500/10 border-emerald-500/30",
    resultText: "text-emerald-500 dark:text-emerald-400",
  },
  violet: {
    border:     "border-violet-500/30",
    header:     "bg-violet-500/[0.07]",
    dot:        "bg-violet-400",
    resultCard: "bg-red-500/10 border-red-500/30",
    resultText: "text-red-500 dark:text-red-400",
  },
} as const;

function AnimPanel({ label, state, accentColor }: AnimPanelProps) {
  const a = ACCENT[accentColor];

  return (
    <div className={cn("rounded-lg border overflow-hidden", a.border)}>
      {/* Panel header */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 border-b",
          a.border,
          a.header,
        )}
      >
        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", a.dot)} />
        <span className="text-sm font-semibold text-[var(--text-dim)]">
          {label}
        </span>
      </div>

      {/* Message list */}
      <div className="px-3 py-3 space-y-2 min-h-[68px]">
        <AnimatePresence>
          {state.chats.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={cn(
                "flex",
                msg.from === "user" ? "justify-end" : "justify-start",
              )}
            >
              {msg.from === "system" ? (
                <span className="text-sm font-mono text-[var(--text-faint)]">
                  <span className="opacity-50 mr-1">›</span>
                  {msg.text}
                </span>
              ) : (
                <span className="text-sm font-mono bg-[var(--surface-3)] text-[var(--text)] rounded-full px-3 py-1">
                  {msg.text}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Result card */}
        <AnimatePresence>
          {state.result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className={cn(
                "mt-1 rounded-md border px-3 py-2 text-center",
                a.resultCard,
              )}
            >
              <p className={cn("text-base font-bold", a.resultText)}>
                {state.result.headline}
              </p>
              <p className="text-sm text-[var(--text-faint)] mt-0.5">
                {state.result.detail}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

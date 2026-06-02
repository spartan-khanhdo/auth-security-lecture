"use client"; // uses useState, useEffect, LaneDiagram + per-panel auto-play

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Monitor, Server, Database, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import LaneDiagram, {
  type Lane,
  type DiagramStep,
} from "@/components/demos/_shared/LaneDiagram";

// ── Lane setup ──────────────────────────────────────────────────────────────

const LANE_ICONS: Record<string, ReactNode> = {
  client: <Monitor  size={30} />,
  server: <Server   size={30} />,
  store:  <Database size={30} />,
};

const BASE_LANES: Omit<Lane, "icon">[] = [
  { id: "client", label: "Client",        sub: "browser / app", color: "#3b82f6" },
  { id: "server", label: "Server",        sub: "API service",    color: "#14b8a6" },
  { id: "store",  label: "Session Store", sub: "DB / Redis",     color: "#f59e0b" },
];

const LANES: Lane[] = BASE_LANES.map((l) => ({
  ...l,
  icon: LANE_ICONS[l.id] ?? <Server size={22} />,
}));

// ── Step data ───────────────────────────────────────────────────────────────

const STATEFUL_STEPS: DiagramStep[] = [
  {
    fromLaneId: "client",
    toLaneId:   "server",
    label:       "POST /login",
    description: "Client sends credentials to the server.",
  },
  {
    fromLaneId: "server",
    toLaneId:   "store",
    label:       "INSERT session",
    description: "Server creates a session record in the store and receives a session ID.",
  },
  {
    fromLaneId: "server",
    toLaneId:   "client",
    label:       "Set-Cookie: session_id",
    description: "Server sends the opaque session ID to the client as an HttpOnly cookie.",
  },
  {
    fromLaneId: "client",
    toLaneId:   "server",
    label:       "GET /api/me",
    description: "Client makes an authenticated request — the cookie is sent automatically.",
  },
  {
    fromLaneId: "server",
    toLaneId:   "store",
    label:       "SELECT session",
    description: "⚠ Server must query the Session Store on every authenticated request to resolve who the session ID belongs to.",
  },
  {
    fromLaneId: "store",
    toLaneId:   "server",
    label:       "user_id: 42",
    description: "Session Store returns the user record for this session ID.",
  },
  {
    fromLaneId: "server",
    toLaneId:   "client",
    label:       "200 user data",
    description: "Server responds with the user's data.",
  },
];

const STATELESS_STEPS: DiagramStep[] = [
  {
    fromLaneId: "client",
    toLaneId:   "server",
    label:       "POST /login",
    description: "Client sends credentials to the server.",
  },
  {
    fromLaneId: "server",
    toLaneId:   "client",
    label:       "JWT token",
    description: "Server issues a signed JWT containing all the user's claims — no session record stored.",
  },
  {
    fromLaneId: "client",
    toLaneId:   "server",
    label:       "GET /api/me",
    description: "Client makes an authenticated request with the JWT in the Authorization header.",
  },
  {
    fromLaneId: "server",
    toLaneId:   "server",
    label:       "verify locally",
    description: "✓ Server verifies the JWT signature locally — zero database or network calls needed.",
  },
  {
    fromLaneId: "server",
    toLaneId:   "client",
    label:       "200 user data",
    description: "Server responds with the user's data.",
  },
];

const STEP_MS = 1200;

// ── Root component ──────────────────────────────────────────────────────────

export default function SessionFlowLane() {
  return (
    <div className="space-y-4">
      <AutoPlayPanel
        title="Stateful — Session-Based"
        accent="teal"
        steps={STATEFUL_STEPS}
      />
      <AutoPlayPanel
        title="Stateless — JWT"
        accent="violet"
        steps={STATELESS_STEPS}
      />
    </div>
  );
}

// ── AutoPlayPanel ───────────────────────────────────────────────────────────

interface AutoPlayPanelProps {
  title: string;
  accent: "teal" | "violet";
  steps: DiagramStep[];
}

const ACCENT = {
  teal: {
    border:  "border-teal-500/25",
    header:  "bg-teal-500/[0.06] border-teal-500/25",
    title:   "text-teal-400",
    btn:     "bg-teal-500 hover:bg-teal-400",
    playing: "text-teal-400",
    done:    "text-emerald-400",
  },
  violet: {
    border:  "border-violet-500/25",
    header:  "bg-violet-500/[0.06] border-violet-500/25",
    title:   "text-violet-400",
    btn:     "bg-violet-500 hover:bg-violet-400",
    playing: "text-violet-400",
    done:    "text-emerald-400",
  },
} as const;

function AutoPlayPanel({ title, accent, steps }: AutoPlayPanelProps) {
  // playKey: null = never started, number = started (increment to restart)
  const [playKey, setPlayKey] = useState<number | null>(null);
  const [step, setStep] = useState(-1);

  const isIdle    = playKey === null;
  const isPlaying = playKey !== null && step < steps.length - 1;
  const isDone    = playKey !== null && step === steps.length - 1;

  useEffect(() => {
    if (playKey === null) return;
    setStep(0);
    let current = 0;
    const id = setInterval(() => {
      current += 1;
      if (current < steps.length) {
        setStep(current);
      } else {
        clearInterval(id);
      }
    }, STEP_MS);
    return () => clearInterval(id);
  // steps.length is stable; playKey drives restart
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playKey]);

  const handleStart  = useCallback(() => setPlayKey(0), []);
  const handleReplay = useCallback(() => {
    setStep(-1);
    setPlayKey((k) => (k ?? 0) + 1);
  }, []);

  const a = ACCENT[accent];
  const currentStep = step >= 0 && step < steps.length ? steps[step] : null;

  return (
    <div className={cn("rounded-xl border overflow-hidden", a.border)}>
      {/* Header */}
      <div className={cn("flex items-center justify-between px-4 py-2.5 border-b", a.header)}>
        <span className={cn("text-xs font-bold uppercase tracking-widest", a.title)}>
          {title}
        </span>

        {/* Step counter pill */}
        {!isIdle && (
          <span className="text-[10px] font-mono text-[var(--text-faint)]">
            {isDone
              ? `${steps.length} / ${steps.length}`
              : `${step + 1} / ${steps.length}`}
          </span>
        )}
      </div>

      {/* Lane diagram */}
      <div className="px-4 pt-4 pb-2 bg-[var(--surface-2)]">
        <LaneDiagram
          lanes={LANES}
          activeStep={currentStep}
          packet={currentStep ? { label: currentStep.label } : null}
          size="lg"
        />
      </div>

      {/* Step description */}
      <div className="px-5 pt-3 pb-3 bg-[var(--surface-2)] min-h-[64px]">
        <p className="text-base text-[var(--text-dim)] leading-relaxed">
          {isIdle && "Press Start to watch the flow animate step by step."}
          {isPlaying && (currentStep?.description ?? "")}
          {isDone && (
            <span className={cn("font-medium", a.done)}>
              Flow complete ✓
            </span>
          )}
        </p>
      </div>

      {/* Control button */}
      <div className="px-5 pb-5 bg-[var(--surface-2)] flex justify-end">
        {isIdle && (
          <button
            onClick={handleStart}
            className={cn(
              "flex items-center gap-2 text-base font-semibold px-5 py-2.5 rounded-lg text-white transition-colors cursor-pointer",
              a.btn,
            )}
          >
            <Play size={16} />
            Start
          </button>
        )}

        {isPlaying && (
          <div className={cn("flex items-center gap-2 text-base font-medium", a.playing)}>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
            Playing…
          </div>
        )}

        {isDone && (
          <button
            onClick={handleReplay}
            className="flex items-center gap-2 text-base font-medium text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw size={16} />
            Replay
          </button>
        )}
      </div>
    </div>
  );
}

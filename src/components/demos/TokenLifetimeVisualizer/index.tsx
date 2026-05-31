"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, AlertTriangle } from "lucide-react";
import DemoFrame from "@/components/demos/_shared/DemoFrame";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCESS_TTL_S = 15 * 60;       // 15 minutes
const REFRESH_TTL_S = 30 * 24 * 3600; // 30 days
const TICK_RATE = 5;                  // seconds advanced per real second in auto-tick

function formatDuration(sec: number): string {
  if (sec <= 0) return "0s";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ─── State shape ─────────────────────────────────────────────────────────────

interface Rotation {
  at: number; // simulated second when rotation happened
  windowEnd: number; // simulated second when new access token expires
}

interface DemoState {
  nowSec: number;
  rotations: Rotation[];
  reuseDetected: boolean;
  autoTick: boolean;
}

function makeInitial(): DemoState {
  return { nowSec: 0, rotations: [], reuseDetected: false, autoTick: false };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TokenLifetimeVisualizer() {
  const [state, setState] = useState<DemoState>(makeInitial);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compute current access token window
  const lastRotation = state.rotations[state.rotations.length - 1];
  const accessStart = lastRotation?.at ?? 0;
  const accessEnd = lastRotation?.windowEnd ?? ACCESS_TTL_S;
  const accessExpired = state.nowSec >= accessEnd;

  // Auto rotate when access expires
  useEffect(() => {
    if (accessExpired && !state.reuseDetected && state.nowSec < REFRESH_TTL_S) {
      // Auto-rotate: create a new window
      const newEnd = Math.min(state.nowSec + ACCESS_TTL_S, REFRESH_TTL_S);
      setState((s) => ({
        ...s,
        rotations: [...s.rotations, { at: s.nowSec, windowEnd: newEnd }],
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessExpired]);

  // Auto-tick
  useEffect(() => {
    if (state.autoTick) {
      intervalRef.current = setInterval(() => {
        setState((s) => {
          if (s.nowSec >= REFRESH_TTL_S) {
            return { ...s, autoTick: false };
          }
          return { ...s, nowSec: Math.min(s.nowSec + TICK_RATE, REFRESH_TTL_S) };
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.autoTick]);

  const handleReset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState(makeInitial());
  }, []);

  const handleNowChange = useCallback((val: number) => {
    setState((s) => ({ ...s, nowSec: val, reuseDetected: false }));
  }, []);

  const handleReuseOldRefresh = useCallback(() => {
    setState((s) => ({ ...s, reuseDetected: true, autoTick: false }));
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const toggleAutoTick = useCallback(() => {
    setState((s) => ({ ...s, autoTick: !s.autoTick }));
  }, []);

  const refreshPercent = (state.nowSec / REFRESH_TTL_S) * 100;

  return (
    <DemoFrame
      title="Token Lifetime Visualizer"
      subtitle="Drag 'now' to watch access-token rotation and see what happens when you reuse a refresh token"
      onReset={handleReset}
      footerNote="Access tokens are short-lived by design — typically 5–15 minutes. Refresh tokens are long-lived but single-use; reusing one triggers token-family invalidation."
    >
      <div className="flex flex-col gap-6 select-none">
        {/* Reuse-detected banner */}
        <AnimatePresence>
          {state.reuseDetected && (
            <motion.div
              key="reuse-banner"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-[var(--red)]/10 border border-[var(--red)]/30"
            >
              <AlertTriangle size={18} className="flex-none text-[var(--red)] mt-0.5" />
              <div>
                <div className="font-semibold text-[var(--red)] text-sm">Token family invalidated</div>
                <div className="text-xs text-[var(--text-dim)] mt-1">
                  Reusing a refresh token is a signal of theft. The server revokes all tokens in the family — the user must re-authenticate.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline */}
        <div className="relative overflow-x-auto">
          <div className="min-w-[320px]" style={{ paddingBottom: 8 }}>
            {/* Labels */}
            <div className="flex justify-between text-xs text-[var(--text-faint)] mb-1 font-mono px-1">
              <span>0</span>
              <span>15 days</span>
              <span>30 days</span>
            </div>

            {/* Row: Refresh token */}
            <div className="mb-3">
              <div className="text-xs text-[var(--text-faint)] mb-1 font-semibold">Refresh token (30 days)</div>
              <div className="relative h-6 bg-[var(--surface-3)] rounded-full overflow-hidden">
                <motion.div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    background: state.reuseDetected
                      ? "var(--red)"
                      : "linear-gradient(90deg, var(--blue), var(--primary))",
                    width: state.reuseDetected ? "100%" : `${refreshPercent}%`,
                  }}
                  animate={{ width: state.reuseDetected ? "100%" : `${refreshPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Row: Access token windows */}
            <div className="mb-3">
              <div className="text-xs text-[var(--text-faint)] mb-1 font-semibold">Access token (15 min windows)</div>
              <div className="relative h-6 bg-[var(--surface-3)] rounded-full overflow-hidden">
                {/* Initial window */}
                <div
                  className="absolute top-0 h-full rounded-full"
                  style={{
                    left: 0,
                    width: `${(ACCESS_TTL_S / REFRESH_TTL_S) * 100}%`,
                    background: "var(--green)",
                    opacity: 0.3,
                  }}
                />
                {/* Rotation windows */}
                {state.rotations.map((r, i) => (
                  <motion.div
                    key={i}
                    className="absolute top-0 h-full rounded-full"
                    style={{
                      left: `${(r.at / REFRESH_TTL_S) * 100}%`,
                      width: `${((r.windowEnd - r.at) / REFRESH_TTL_S) * 100}%`,
                      background: "var(--green)",
                      opacity: 0.6 + i * 0.05,
                    }}
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                ))}
              </div>
            </div>

            {/* "Now" cursor — slider */}
            <div className="mt-2">
              <div className="text-xs text-[var(--text-faint)] mb-1 font-semibold flex justify-between">
                <span>Drag &ldquo;now&rdquo; cursor</span>
                <span className="font-mono">{formatDuration(state.nowSec)} elapsed</span>
              </div>
              <input
                type="range"
                min={0}
                max={REFRESH_TTL_S}
                step={60}
                value={state.nowSec}
                onChange={(e) => handleNowChange(Number(e.target.value))}
                className="w-full accent-[var(--primary)] cursor-pointer"
                aria-label="Simulated now cursor"
              />
            </div>

            {/* Visual cursor line */}
            <div className="relative h-2 mt-1">
              <motion.div
                className="absolute top-0 w-0.5 h-6 bg-[var(--amber)] rounded-full -translate-y-1/2"
                animate={{ left: `${(state.nowSec / REFRESH_TTL_S) * 100}%` }}
                transition={{ type: "tween", duration: 0.1 }}
                style={{ left: `${(state.nowSec / REFRESH_TTL_S) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Status row */}
        <div className="grid grid-cols-2 gap-3">
          <StatusCard
            label="Access token"
            value={accessExpired ? "Expired — rotating" : `Expires in ${formatDuration(accessEnd - state.nowSec)}`}
            tone={accessExpired ? "warn" : "ok"}
          />
          <StatusCard
            label="Refresh token"
            value={
              state.reuseDetected
                ? "Family invalidated"
                : state.nowSec >= REFRESH_TTL_S
                ? "Expired — re-login required"
                : `Expires in ${formatDuration(REFRESH_TTL_S - state.nowSec)}`
            }
            tone={state.reuseDetected || state.nowSec >= REFRESH_TTL_S ? "danger" : "ok"}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={toggleAutoTick}
            disabled={state.nowSec >= REFRESH_TTL_S || state.reuseDetected}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-dim)] hover:text-[var(--text)] disabled:opacity-40 cursor-pointer transition-colors"
          >
            {state.autoTick ? <Pause size={14} /> : <Play size={14} />}
            {state.autoTick ? "Pause" : "Auto-tick (5s/sec)"}
          </button>

          <button
            onClick={handleReuseOldRefresh}
            disabled={state.reuseDetected}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-[var(--red)]/10 border border-[var(--red)]/30 text-[var(--red)] hover:bg-[var(--red)]/20 disabled:opacity-40 cursor-pointer transition-colors"
          >
            <RotateCcw size={14} />
            Reuse old refresh token
          </button>
        </div>

        <div className="text-xs text-[var(--text-faint)] leading-relaxed">
          Rotations: {state.rotations.length} · &ldquo;Now&rdquo; is at {formatDuration(state.nowSec)} ({((state.nowSec / REFRESH_TTL_S) * 100).toFixed(1)}% of refresh window)
        </div>
      </div>
    </DemoFrame>
  );
}

function StatusCard({ label, value, tone }: { label: string; value: string; tone: "ok" | "warn" | "danger" }) {
  const styles = {
    ok: "bg-[var(--green)]/10 border-[var(--green)]/20 text-[var(--green)]",
    warn: "bg-[var(--amber)]/10 border-[var(--amber)]/20 text-[var(--amber)]",
    danger: "bg-[var(--red)]/10 border-[var(--red)]/20 text-[var(--red)]",
  }[tone];
  return (
    <div className={`rounded-xl border p-3 ${styles}`}>
      <div className="text-xs text-[var(--text-faint)] mb-0.5">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

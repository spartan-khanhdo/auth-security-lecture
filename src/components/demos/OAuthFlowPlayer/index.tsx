"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Globe, Server, Shield, User, Smartphone } from "lucide-react";
import type { ReactNode } from "react";
import DemoFrame from "@/components/demos/_shared/DemoFrame";
import LaneDiagram, { type Lane, type DiagramStep } from "@/components/demos/_shared/LaneDiagram";
import Stepper from "@/components/demos/_shared/Stepper";
import { OAUTH_PRESETS, type OAuthPreset } from "./presets";

// ─── Lane icons ───────────────────────────────────────────────────────────────
// Icons are injected here (not in presets.ts) to keep JSX out of .ts files

const LANE_ICONS: Record<string, ReactNode> = {
  browser:  <Globe size={24} />,
  app:      <Smartphone size={24} />,
  auth:     <Shield size={24} />,
  service:  <Server size={24} />,
  api:      <Server size={24} />,
  user:     <User size={24} />,
  provider: <Shield size={24} />,
};

function hydrateLanes(lanes: Lane[]): Lane[] {
  return lanes.map((l) => ({
    ...l,
    icon: LANE_ICONS[l.id] ?? <Globe size={24} />,
  }));
}

// ─── State ────────────────────────────────────────────────────────────────────

interface DemoState {
  presetId: string;
  step: number; // -1 = idle (not started)
}

function initialState(presetId = OAUTH_PRESETS[0].id): DemoState {
  return { presetId, step: -1 };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OAuthFlowPlayer() {
  const [state, setState] = useState<DemoState>(initialState);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const preset: OAuthPreset =
    OAUTH_PRESETS.find((p) => p.id === state.presetId) ?? OAUTH_PRESETS[0];
  const steps: DiagramStep[] = preset.steps;
  const lanes: Lane[] = hydrateLanes(preset.lanes);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const goToStep = useCallback((step: number) => {
    clearTimer();
    setState((s) => ({ ...s, step }));
  }, [clearTimer]);

  const handleNext = useCallback(() => {
    setState((s) => ({
      ...s,
      step: Math.min(s.step + 1, steps.length - 1),
    }));
  }, [steps.length]);

  const handlePrev = useCallback(() => {
    setState((s) => ({ ...s, step: Math.max(s.step - 1, -1) }));
  }, []);

  const handleReplay = useCallback(() => goToStep(-1), [goToStep]);

  const handlePresetChange = useCallback((id: string) => {
    clearTimer();
    setState(initialState(id));
  }, [clearTimer]);

  const handleReset = useCallback(() => {
    clearTimer();
    setState(initialState(state.presetId));
  }, [clearTimer, state.presetId]);

  const currentStep: DiagramStep | null =
    state.step >= 0 && state.step < steps.length ? steps[state.step] : null;

  const isIdle = state.step < 0;
  const isDone = state.step >= steps.length - 1;

  return (
    <DemoFrame
      title="OAuth Flow Player"
      subtitle="Step through three OAuth grant types and watch the packet exchange"
      onReset={state.step !== -1 ? handleReset : undefined}
      footerNote={preset.takeaway}
    >
      {/* Preset tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {OAUTH_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => handlePresetChange(p.id)}
            title={p.description}
            className={[
              "text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-medium",
              state.presetId === p.id
                ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                : "bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-3)]",
            ].join(" ")}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Lane diagram */}
      <div className="bg-[var(--surface-2)] rounded-2xl border border-[var(--border-subtle)] p-5 mb-4">
        <LaneDiagram
          key={state.presetId}
          lanes={lanes}
          activeStep={currentStep}
          packet={currentStep ? { label: currentStep.label } : null}
        />
      </div>

      {/* Step readout */}
      <div className="text-center min-h-[72px] px-4">
        <div className="text-xs text-[var(--text-faint)] font-mono uppercase tracking-widest mb-1">
          {isIdle
            ? "ready"
            : isDone
            ? "done"
            : `step ${state.step + 1} / ${steps.length}`}
        </div>
        <p className="text-sm text-[var(--text-dim)] max-w-prose mx-auto leading-relaxed">
          {isIdle
            ? "Watch how the authorization flow works — press Start to step through each message."
            : currentStep?.description ?? ""}
        </p>
        {isDone && (
          <div className="mt-2 inline-flex items-center gap-1.5 text-[var(--green)] text-sm font-semibold">
            Flow complete — tokens issued.
          </div>
        )}
      </div>

      {/* Stepper controls */}
      <Stepper
        step={state.step}
        total={steps.length}
        canPrev={state.step >= 0}
        canNext={!isDone}
        onPrev={handlePrev}
        onNext={handleNext}
        onReplay={handleReplay}
        idleLabel="Start the flow"
      />
    </DemoFrame>
  );
}

"use client";

import { useState, useCallback } from "react";
import { Server, Laptop, CheckCircle, XCircle } from "lucide-react";
import DemoFrame from "@/components/demos/_shared/DemoFrame";
import LaneDiagram, { type Lane, type DiagramStep } from "@/components/demos/_shared/LaneDiagram";
import Stepper from "@/components/demos/_shared/Stepper";

// ─── Lanes ────────────────────────────────────────────────────────────────────

const LANES: Lane[] = [
  {
    id: "client",
    label: "Client",
    sub: "service-a",
    icon: <Laptop size={24} />,
    color: "var(--pill-person)",
  },
  {
    id: "server",
    label: "Server",
    sub: "service-b",
    icon: <Server size={24} />,
    color: "var(--blue)",
  },
];

// ─── Steps per scenario ───────────────────────────────────────────────────────

type Scenario = "happy" | "expired-server" | "expired-client" | "unknown-ca";

interface ScenarioStep extends DiagramStep {
  outcome?: "ok" | "fail";
  note?: string;
}

const HAPPY_STEPS: ScenarioStep[] = [
  {
    fromLaneId: "client",
    toLaneId: "server",
    label: "ClientHello",
    description: "The client initiates the TLS handshake, proposing cipher suites and indicating it supports mutual TLS.",
    outcome: "ok",
  },
  {
    fromLaneId: "server",
    toLaneId: "client",
    label: "ServerHello + server cert",
    description: "The server replies with its certificate (issued by a CA trusted by both parties) and requests the client's certificate.",
    outcome: "ok",
  },
  {
    fromLaneId: "client",
    toLaneId: "client",
    label: "Validate server cert",
    description: "The client verifies the server certificate against its trust store: CA signature, hostname, and expiry. All good.",
    outcome: "ok",
  },
  {
    fromLaneId: "client",
    toLaneId: "server",
    label: "Client cert + signed proof",
    description: "The client sends its own certificate and a digital signature proving it holds the corresponding private key.",
    outcome: "ok",
  },
  {
    fromLaneId: "server",
    toLaneId: "server",
    label: "Validate client cert",
    description: "The server verifies the client certificate against its CA trust store. CN=service-a — identity confirmed.",
    outcome: "ok",
  },
  {
    fromLaneId: "server",
    toLaneId: "client",
    label: "Handshake complete",
    description: "Mutual trust established. The server extracts CN=service-a from the client cert and uses it for authorization decisions. All subsequent data is encrypted.",
    outcome: "ok",
  },
];

const EXPIRED_SERVER_STEPS: ScenarioStep[] = [
  HAPPY_STEPS[0],
  HAPPY_STEPS[1],
  {
    fromLaneId: "client",
    toLaneId: "client",
    label: "Validate server cert — FAIL",
    description: "The server certificate has expired. The client terminates the handshake immediately with a TLS alert: certificate expired.",
    outcome: "fail",
    note: "certificate expired (SSL_ERROR_EXPIRED_CERT_ALERT)",
  },
];

const EXPIRED_CLIENT_STEPS: ScenarioStep[] = [
  HAPPY_STEPS[0],
  HAPPY_STEPS[1],
  HAPPY_STEPS[2],
  HAPPY_STEPS[3],
  {
    fromLaneId: "server",
    toLaneId: "server",
    label: "Validate client cert — FAIL",
    description: "The client certificate has expired. The server rejects the handshake with a TLS alert: certificate expired.",
    outcome: "fail",
    note: "certificate expired (SSL_ERROR_EXPIRED_CERT_ALERT)",
  },
];

const UNKNOWN_CA_STEPS: ScenarioStep[] = [
  HAPPY_STEPS[0],
  HAPPY_STEPS[1],
  {
    fromLaneId: "client",
    toLaneId: "client",
    label: "Validate server cert — FAIL",
    description: "The server certificate was issued by a CA not in the client's trust store. The client refuses to continue — unknown CA.",
    outcome: "fail",
    note: "unknown certificate authority (SSL_ERROR_UNKNOWN_CA_ALERT)",
  },
];

const SCENARIO_STEPS: Record<Scenario, ScenarioStep[]> = {
  happy: HAPPY_STEPS,
  "expired-server": EXPIRED_SERVER_STEPS,
  "expired-client": EXPIRED_CLIENT_STEPS,
  "unknown-ca": UNKNOWN_CA_STEPS,
};

const SCENARIO_LABELS: Record<Scenario, string> = {
  happy: "Happy path",
  "expired-server": "Expired server cert",
  "expired-client": "Expired client cert",
  "unknown-ca": "Unknown CA",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface DemoState {
  scenario: Scenario;
  step: number; // -1 = idle
}

export default function MTLSVisualizer() {
  const [state, setState] = useState<DemoState>({ scenario: "happy", step: -1 });

  const steps = SCENARIO_STEPS[state.scenario];
  const currentStep = state.step >= 0 && state.step < steps.length ? steps[state.step] : null;
  const isIdle = state.step < 0;
  const isDone = state.step >= steps.length - 1;
  const isFailed = currentStep?.outcome === "fail";

  const handleScenario = useCallback((s: Scenario) => {
    setState({ scenario: s, step: -1 });
  }, []);

  const handleNext = useCallback(() => {
    setState((s) => {
      const cur = SCENARIO_STEPS[s.scenario][s.step];
      if (cur?.outcome === "fail") return s; // stop at failure
      return { ...s, step: Math.min(s.step + 1, SCENARIO_STEPS[s.scenario].length - 1) };
    });
  }, []);

  const handlePrev = useCallback(() => {
    setState((s) => ({ ...s, step: Math.max(s.step - 1, -1) }));
  }, []);

  const handleReplay = useCallback(() => {
    setState((s) => ({ ...s, step: -1 }));
  }, []);

  const handleReset = useCallback(() => {
    setState({ scenario: "happy", step: -1 });
  }, []);

  // Adapt currentStep to DiagramStep (remove extra fields)
  const diagramStep: DiagramStep | null = currentStep
    ? {
        fromLaneId: currentStep.fromLaneId,
        toLaneId: currentStep.toLaneId,
        label: currentStep.label,
        description: currentStep.description,
      }
    : null;

  // NOTE: must allow advancing from idle (step === -1) so the "Start handshake"
  // button is enabled — gating on !isIdle disabled the very button that starts it.
  const canNext = !isDone && !isFailed;

  return (
    <DemoFrame
      title="mTLS Handshake Visualizer"
      subtitle="Step through the mutual TLS handshake — and inject certificate failures"
      onReset={state.step !== -1 ? handleReset : undefined}
      footerNote="In mTLS both sides present certificates. The handshake fails if either cert is expired, self-signed, or issued by an untrusted CA — providing cryptographically verified service identity."
    >
      {/* Scenario selector */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(Object.keys(SCENARIO_LABELS) as Scenario[]).map((s) => (
          <button
            key={s}
            onClick={() => handleScenario(s)}
            className={[
              "text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-medium",
              state.scenario === s
                ? s === "happy"
                  ? "bg-[var(--green)]/15 border-[var(--green)]/40 text-[var(--green)]"
                  : "bg-[var(--red)]/15 border-[var(--red)]/40 text-[var(--red)]"
                : "bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-3)]",
            ].join(" ")}
          >
            {SCENARIO_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Lane diagram */}
      <div className="bg-[var(--surface-2)] rounded-2xl border border-[var(--border-subtle)] p-5 mb-4">
        <LaneDiagram
          key={state.scenario}
          lanes={LANES}
          activeStep={diagramStep}
          packet={currentStep && !currentStep.fromLaneId.startsWith(currentStep.toLaneId)
            ? { label: currentStep.label }
            : currentStep
            ? { label: currentStep.label }
            : null}
        />
      </div>

      {/* Step readout */}
      <div className="text-center min-h-[80px] px-4">
        <div className="text-xs text-[var(--text-faint)] font-mono uppercase tracking-widest mb-1">
          {isIdle
            ? "ready"
            : isFailed
            ? "handshake failed"
            : isDone
            ? "handshake complete"
            : `step ${state.step + 1} / ${steps.length}`}
        </div>
        <p className="text-sm text-[var(--text-dim)] max-w-prose mx-auto leading-relaxed">
          {isIdle
            ? "Select a scenario and press Start to walk through the mTLS handshake step by step."
            : currentStep?.description ?? ""}
        </p>
        {isFailed && currentStep?.note && (
          <div className="mt-2 inline-flex items-center gap-1.5 text-[var(--red)] text-xs font-mono bg-[var(--red)]/10 px-3 py-1.5 rounded-full border border-[var(--red)]/20">
            <XCircle size={12} />
            {currentStep.note}
          </div>
        )}
        {isDone && state.scenario === "happy" && (
          <div className="mt-2 inline-flex items-center gap-1.5 text-[var(--green)] text-sm font-semibold">
            <CheckCircle size={16} />
            Mutual auth established — CN=service-a verified
          </div>
        )}
      </div>

      {/* Stepper */}
      <Stepper
        step={state.step}
        total={steps.length}
        canPrev={state.step >= 0}
        canNext={canNext}
        onPrev={handlePrev}
        onNext={handleNext}
        onReplay={handleReplay}
        idleLabel="Start handshake"
      />
    </DemoFrame>
  );
}

"use client";

import { type ReactNode } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

interface JsonViewerProps {
  value: unknown;
  highlightKeys?: string[];
  keyTooltips?: Record<string, string>;
}

type TokenKind = "key" | "string" | "number" | "boolean" | "null" | "punct";

interface Token {
  kind: TokenKind;
  text: string;
  keyName?: string; // only when kind === "key"
}

function tokenize(json: string): Token[] {
  const tokens: Token[] = [];
  // Matches: string (key or value), number, true/false/null, punctuation
  const re = /("(?:[^"\\]|\\.)*")\s*(:)?|(true|false|null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],])/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(json)) !== null) {
    if (match[1] !== undefined) {
      if (match[2] !== undefined) {
        // It's a key (followed by colon)
        const keyName = match[1].slice(1, -1); // strip quotes
        tokens.push({ kind: "key", text: match[1], keyName });
        tokens.push({ kind: "punct", text: ":" });
      } else {
        tokens.push({ kind: "string", text: match[1] });
      }
    } else if (match[3] !== undefined) {
      tokens.push({ kind: "boolean", text: match[3] === "null" ? match[3] : match[3], ...(match[3] === "null" ? { kind: "null" as TokenKind } : {}) });
    } else if (match[4] !== undefined) {
      tokens.push({ kind: "number", text: match[4] });
    } else if (match[5] !== undefined) {
      tokens.push({ kind: "punct", text: match[5] });
    }
  }
  return tokens;
}

const KIND_COLORS: Record<TokenKind, string> = {
  key: "text-[var(--blue)]",
  string: "text-[var(--green)]",
  number: "text-[var(--orange)]",
  boolean: "text-[var(--pink)]",
  null: "text-[var(--text-faint)]",
  punct: "text-[var(--text-dim)]",
};

function TokenSpan({
  token,
  isHighlighted,
  tooltip,
}: {
  token: Token;
  isHighlighted: boolean;
  tooltip?: string;
}) {
  const baseClass = [
    "font-mono",
    KIND_COLORS[token.kind],
    isHighlighted
      ? "bg-amber-400/20 ring-1 ring-amber-400/40 rounded-sm px-0.5"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const inner = <span className={baseClass}>{token.text}</span>;

  if (tooltip) {
    return (
      <Tooltip.Provider delayDuration={200}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <span className="cursor-help">{inner}</span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              side="top"
              className="z-50 max-w-[240px] rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-dim)] shadow-md"
            >
              {tooltip}
              <Tooltip.Arrow className="fill-[var(--surface-3)]" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    );
  }

  return inner;
}

/**
 * Pretty-prints JSON with per-token syntax colouring.
 * Highlighted keys get an amber ring. Keys with tooltips show on hover.
 */
export default function JsonViewer({
  value,
  highlightKeys = [],
  keyTooltips = {},
}: JsonViewerProps): ReactNode {
  const json = JSON.stringify(value, null, 2);
  const tokens = tokenize(json);

  return (
    <pre className="text-xs leading-relaxed whitespace-pre-wrap break-all font-mono bg-[var(--code-bg)] border border-[var(--border-subtle)] rounded-xl p-4 overflow-auto">
      {tokens.map((token, i) => {
        const key = token.kind === "key" ? token.keyName ?? "" : "";
        const isHighlighted = token.kind === "key" && highlightKeys.includes(key);
        const tooltip = token.kind === "key" ? keyTooltips[key] : undefined;
        return (
          <TokenSpan
            key={i}
            token={token}
            isHighlighted={isHighlighted}
            tooltip={tooltip}
          />
        );
      })}
    </pre>
  );
}

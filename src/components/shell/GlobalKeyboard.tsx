"use client";

import { useEffect } from "react";

/**
 * GlobalKeyboard — mounts a single keydown listener for Escape.
 *
 * When Escape is pressed and the active element is NOT an interactive text
 * input (input, textarea, or contenteditable), dispatches a custom
 * `shell:escape` event on `document`. Consumers (e.g. the lecture player,
 * modals) can listen for this event without coupling directly to this component.
 *
 * Arrow keys are intentionally NOT bound here — the player manages its own
 * keyboard navigation.
 *
 * Renders nothing visible. Mount once inside <body>.
 */
export default function GlobalKeyboard() {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      const active = document.activeElement as HTMLElement | null;
      if (!active) {
        document.dispatchEvent(new CustomEvent("shell:escape"));
        return;
      }

      const tag = active.tagName.toLowerCase();
      const isTextInput = tag === "input" || tag === "textarea";
      const isContentEditable =
        active.isContentEditable === true;

      if (!isTextInput && !isContentEditable) {
        document.dispatchEvent(new CustomEvent("shell:escape"));
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}

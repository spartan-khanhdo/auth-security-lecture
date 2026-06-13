"use client";
// "use client" — uses Framer Motion animations

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import type { TakeawaysUnit } from "@/content/types";

function isNegative(text: string) {
  return /^never\b/i.test(text.trimStart());
}

interface TakeawaysRendererProps {
  unit: TakeawaysUnit;
}

export default function TakeawaysRenderer({ unit }: TakeawaysRendererProps) {
  return (
    <div className="max-w-3xl mx-auto w-full">

      {/* Items */}
      <ul className="flex flex-col gap-3">
        {unit.items.map((point, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start gap-4 px-5 py-4 rounded-xl text-base text-[var(--text)]"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
            }}
          >
            {/* Icon circle — X for "Never" items, check for positive ones */}
            <span
              className="flex-none grid place-items-center rounded-full mt-0.5"
              style={{
                width: 26,
                height: 26,
                background: isNegative(point)
                  ? "color-mix(in srgb, var(--red) 18%, transparent)"
                  : "color-mix(in srgb, var(--green) 18%, transparent)",
                color: isNegative(point) ? "var(--red)" : "var(--green)",
              }}
            >
              {isNegative(point)
                ? <X size={14} strokeWidth={2.5} />
                : <Check size={14} strokeWidth={2.5} />}
            </span>
            <span>{point}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

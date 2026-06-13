"use client"; // "use client" — uses framer-motion animations

import { motion } from "framer-motion";
import type { SectionUnit } from "@/content/types";

interface SectionRendererProps {
  unit: SectionUnit;
}

export default function SectionRenderer({ unit }: SectionRendererProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[60vh] w-full text-center gap-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="w-16 h-1 rounded-full bg-[var(--primary)]" />
      <h2 className="text-5xl font-bold text-[var(--text)] tracking-tight leading-tight">
        {unit.title}
      </h2>
      {unit.subtitle && (
        <p className="text-xl text-[var(--text-dim)] max-w-2xl leading-relaxed">
          {unit.subtitle}
        </p>
      )}
    </motion.div>
  );
}

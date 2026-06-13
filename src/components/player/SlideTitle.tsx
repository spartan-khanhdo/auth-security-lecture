"use client";

import {
  ArrowLeftRight, Lock, Key, RefreshCw, AlertTriangle, ShieldOff,
  Server, Database, Clock, Users, Shield, Globe, Zap, BookMarked,
  Hash, Activity, FileKey, CheckCircle2, Cpu, Code2, Eye, Layers,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  ArrowLeftRight, Lock, Key, RefreshCw, AlertTriangle, ShieldOff,
  Server, Database, Clock, Users, Shield, Globe, Zap, BookMarked,
  Hash, Activity, FileKey, CheckCircle2, Cpu, Code2, Eye, Layers,
};

interface SlideTitleProps {
  title: string;
  icon?: string;
  iconColor?: string;
}

export default function SlideTitle({ title, icon, iconColor = "var(--primary-2)" }: SlideTitleProps) {
  const Icon = icon ? ICON_MAP[icon] : null;

  return (
    <div className="flex items-center justify-center gap-3 w-full">
      {Icon && (
        <span
          className="flex-none grid place-items-center rounded-2xl p-2.5"
          style={{ background: iconColor, color: "#fff" }}
        >
          <Icon size={26} strokeWidth={1.8} />
        </span>
      )}
      <h2 className="text-3xl font-bold text-[var(--text)] tracking-tight leading-tight">
        {title}
      </h2>
    </div>
  );
}

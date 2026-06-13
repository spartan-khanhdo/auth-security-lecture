/* Shared primitives: icons, pills, avatars, scroll hooks */
const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* ---------- inline icon set (simple, hand-tuned) ---------- */
const I = {
  key: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="4.5"/><path d="M11 11l8 8M16 16l2.5-2.5M19 19l2-2"/></svg>,
  pencil: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20l4-1L19 8l-3-3L5 16l-1 4z"/><path d="M14.5 6.5l3 3"/></svg>,
  eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>,
  doc: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/></svg>,
  question: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.4a2.8 2.8 0 0 1 5.4 1c0 1.9-2.6 2-2.6 3.6"/><circle cx="12" cy="17.4" r=".6" fill="currentColor"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  checkCircle: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M8 12.2l2.6 2.6L16 9.4"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  lock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2.4"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>,
  unlock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2.4"/><path d="M8 11V8a4 4 0 0 1 7.6-1.6"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 5-3.3 8.4-7 10-3.7-1.6-7-5-7-10V6z"/></svg>,
  fingerprint: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4.5a7.5 7.5 0 0 0-7.5 7.5v2"/><path d="M12 4.5A7.5 7.5 0 0 1 19.5 12v3.5"/><path d="M8 12a4 4 0 0 1 8 0v3a3 3 0 0 0 .6 1.8"/><path d="M12 12v4a4 4 0 0 0 1 2.7"/><path d="M7.5 16.5A6 6 0 0 0 8.8 19"/></svg>,
  hash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4L7 20M17 4l-2 16M4 9h16M3 15h16"/></svg>,
  ticket: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 5v14"/></svg>,
  phone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="3" width="10" height="18" rx="2.4"/><path d="M11 18h2"/></svg>,
  swap: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>,
  arrow: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  play: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7z"/></svg>,
  reset: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5v5h5"/><path d="M5 13a8 8 0 1 0 2.3-6.3L4 10"/></svg>,
  sun: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></svg>,
  moon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z"/></svg>,
  code: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/></svg>,
  google: <svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22 12.2c0-.7-.06-1.4-.18-2.05H12v3.9h5.6a4.8 4.8 0 0 1-2.08 3.15v2.6h3.36C20.84 18 22 15.4 22 12.2z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.42l-3.36-2.6c-.93.62-2.12.99-3.26.99-2.5 0-4.62-1.69-5.38-3.96H3.16v2.69A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.62 14.01a6 6 0 0 1 0-3.82V7.5H3.16a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6.22c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.96 3.2 14.7 2.3 12 2.3A10 10 0 0 0 3.16 7.5l3.46 2.69C7.38 7.91 9.5 6.22 12 6.22z"/></svg>,
};

/* ---------- People ---------- */
const PEOPLE = {
  Kim: { color: "#ff8a5b", initials: "K" },
  Ben: { color: "#ff6b9d", initials: "B" },
  Carl:{ color: "#9b8cff", initials: "C" },
  Mei: { color: "#4ec5b5", initials: "M" },
};

function Avatar({ name, size = 22 }) {
  const p = PEOPLE[name] || { color: "var(--primary)", initials: (name || "?")[0] };
  return (
    <span className="ava" style={{
      width: size, height: size, borderRadius: 999, display: "grid", placeItems: "center",
      background: p.color, color: "#fff", fontWeight: 700, fontSize: size * 0.46,
      fontFamily: "var(--font-display)", flex: "none",
    }}>{p.initials}</span>
  );
}

/* ---------- Pill (matches reference candy badges) ---------- */
function Pill({ kind = "object", icon, person, children, lg, style, className = "", title }) {
  const cls = `pill ${kind} ${person ? "avatar-pill" : ""} ${lg ? "lg" : ""} ${className}`;
  return (
    <span className={cls} style={style} title={title}>
      {person ? <Avatar name={person} size={lg ? 26 : 22} />
        : icon ? <span className="ico">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
}

/* ---------- scroll reveal ---------- */
function useInView(opts = {}) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { threshold: opts.threshold ?? 0.18, rootMargin: opts.rootMargin ?? "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen];
}

function Reveal({ children, delay = 0, as: Tag = "div", className = "", style }) {
  const [ref, seen] = useInView();
  return (
    <Tag ref={ref} className={`reveal ${seen ? "in" : ""} ${className}`}
      style={{ ...style, transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

/* small helper: copy to clipboard */
function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback((t) => {
    try { navigator.clipboard.writeText(t); } catch (e) {}
    setCopied(true); setTimeout(() => setCopied(false), 1300);
  }, []);
  return [copied, copy];
}

Object.assign(window, { I, PEOPLE, Avatar, Pill, useInView, Reveal, useCopy });

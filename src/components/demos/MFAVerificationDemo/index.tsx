'use client';

import { useState, useEffect, useMemo, useRef } from 'react';

const PERIOD = 30;
const SECRET = 'JBSWY3DPEHPK3PXP';

function computeCode(windowIdx: number): string {
  let hash = 0;
  const str = SECRET + ':' + windowIdx;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 1000000).toString().padStart(6, '0');
}

const R = 26;
const C = 2 * Math.PI * R;

export default function MFAVerificationDemo() {
  const [now, setNow] = useState(() => Date.now());
  const [entered, setEntered] = useState('');
  const [verified, setVerified] = useState(false);
  const [shake, setShake] = useState(false);
  const prevWinRef = useRef<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const sec = Math.floor(now / 1000);
  const windowIdx = Math.floor(sec / PERIOD);
  const code = useMemo(() => computeCode(windowIdx), [windowIdx]);
  const remaining = PERIOD - (sec % PERIOD);
  const frac = remaining / PERIOD;
  const isLow = remaining <= 5;

  useEffect(() => {
    if (prevWinRef.current !== null && prevWinRef.current !== windowIdx && !verified) {
      setEntered('');
    }
    prevWinRef.current = windowIdx;
  }, [windowIdx, verified]);

  const submit = (val?: string) => {
    const v = (val ?? entered).replace(/\D/g, '').slice(0, 6);
    if (v.length < 6) return;
    if (v === code) {
      setVerified(true);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setEntered(''), 450);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
    setEntered(v);
    if (v.length === 6) submit(v);
  };

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto not-prose">

      {/* ── Factor row ─────────────────────────────────────────────── */}
      <div className="flex items-stretch gap-3 justify-center flex-wrap">
        {/* Factor 1 — done */}
        <div
          className="flex gap-3 items-center p-3.5 px-4 border rounded-xl bg-[var(--surface)] flex-1 min-w-[200px]"
          style={{ borderColor: 'color-mix(in srgb, var(--green) 38%, var(--border))' }}
        >
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
            style={{ background: 'color-mix(in srgb, var(--green) 20%, transparent)', color: 'var(--green)' }}
          >
            ✓
          </span>
          <div>
            <b className="block text-base">Something you know</b>
            <span className="text-base text-[var(--text-dim)]">Password — already verified ✓</span>
          </div>
        </div>

        <div className="flex items-center font-bold text-xl text-[var(--text-faint)]">+</div>

        {/* Factor 2 — active / done */}
        <div
          className="flex gap-3 items-center p-3.5 px-4 border rounded-xl bg-[var(--surface)] flex-1 min-w-[200px] transition-all duration-300"
          style={{
            borderColor: verified
              ? 'color-mix(in srgb, var(--green) 38%, var(--border))'
              : 'var(--primary)',
            boxShadow: verified ? 'none' : '0 0 0 4px var(--primary-soft)',
          }}
        >
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base transition-all duration-300"
            style={{
              background: verified
                ? 'color-mix(in srgb, var(--green) 20%, transparent)'
                : 'var(--primary-soft)',
              color: verified ? 'var(--green)' : 'var(--primary-2)',
            }}
          >
            {verified ? '✓' : '📱'}
          </span>
          <div>
            <b className="block text-base">Something you have</b>
            <span className="text-base text-[var(--text-dim)]">A one-time code from your phone</span>
          </div>
        </div>
      </div>

      {/* ── Stage ──────────────────────────────────────────────────── */}
      <div className="flex gap-4 items-stretch justify-center flex-wrap">

        {/* Authenticator "app" */}
        <div
          className="w-60 shrink-0 rounded-2xl p-5 text-center border border-[var(--border-subtle)] shadow-md"
          style={{ background: 'linear-gradient(165deg, var(--surface-2), var(--surface))' }}
        >
          <div className="flex items-center justify-center gap-2 text-base font-semibold text-[var(--text-dim)]">
            🔒 Authenticator
          </div>
          <div className="font-mono text-[11.5px] text-[var(--text-faint)] mt-1.5">
            Acme · kim@acme.dev
          </div>

          <div className="font-mono text-[38px] font-bold tracking-wider my-4 text-[var(--text)] leading-none">
            {code.slice(0, 3)}&thinsp;{code.slice(3)}
          </div>

          {/* Countdown ring */}
          <div className="relative mx-auto" style={{ width: 60, height: 60 }}>
            <svg viewBox="0 0 60 60" width="60" height="60">
              <circle cx="30" cy="30" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="5" />
              <circle
                cx="30" cy="30" r={R}
                fill="none"
                stroke={isLow ? 'var(--red)' : 'var(--primary)'}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - frac)}
                transform="rotate(-90 30 30)"
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center font-mono text-[15px] font-bold"
              style={{ color: isLow ? 'var(--red)' : 'var(--text-dim)' }}
            >
              {remaining}
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-faint)] mt-2">refreshes every 30s</div>
        </div>

        {/* Arrow */}
        <div className="flex items-center text-[var(--text-faint)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>

        {/* Verify card */}
        <div className="flex-1 min-w-[260px] p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] flex flex-col items-center justify-center">
          {!verified ? (
            <>
              <h4 className="text-base font-semibold mb-4">Enter the 6-digit code</h4>

              <div className="relative">
                <div
                  className="flex gap-2"
                  style={{ animation: shake ? 'shake 0.45s' : 'none' }}
                >
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <span
                      key={i}
                      className="w-[42px] h-[52px] rounded-xl border bg-[var(--surface-2)] flex items-center justify-center font-mono text-2xl font-bold text-[var(--text)] transition-all duration-200"
                      style={{
                        borderColor: entered.length === i
                          ? 'var(--primary)'
                          : entered[i]
                            ? 'var(--primary)'
                            : 'var(--border-subtle)',
                        boxShadow: entered.length === i ? '0 0 0 3px var(--primary-soft)' : 'none',
                      }}
                    >
                      {entered[i] ?? ''}
                    </span>
                  ))}
                </div>
                <input
                  className="absolute inset-0 opacity-0 cursor-text text-base"
                  inputMode="numeric"
                  autoFocus
                  value={entered}
                  onChange={handleInput}
                />
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  className="px-3 py-1.5 rounded-lg text-base font-semibold border border-[var(--border-subtle)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-dim)] transition-colors cursor-pointer"
                  onClick={() => { setEntered(code); submit(code); }}
                >
                  autofill
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg text-base font-semibold border border-[var(--border-subtle)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-dim)] transition-colors cursor-pointer"
                  onClick={() => setEntered('000000')}
                >
                  try a wrong one
                </button>
              </div>

              <p className="text-[12.5px] text-center mt-3.5 text-[var(--text-dim)] max-w-[36ch]">
                Steal the password alone and you still can&apos;t get in — the attacker would also need the phone generating this code.
              </p>
            </>
          ) : (
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-3.5 flex items-center justify-center"
                style={{
                  background: 'color-mix(in srgb, var(--green) 18%, transparent)',
                  color: 'var(--green)',
                  animation: 'popIn 0.5s var(--ease-back) both',
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h4 className="text-xl font-bold">You&apos;re in.</h4>
              <p className="text-base text-[var(--text-dim)] mt-2 mb-4">
                Two factors verified. Even a leaked password isn&apos;t enough on its own.
              </p>
              <button
                className="px-3 py-1.5 rounded-lg text-base font-semibold border border-[var(--border-subtle)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-dim)] transition-colors cursor-pointer"
                onClick={() => { setVerified(false); setEntered(''); }}
              >
                ↩ Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

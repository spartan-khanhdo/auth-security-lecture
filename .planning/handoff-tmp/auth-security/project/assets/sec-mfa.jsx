/* Demo — MFA / OTP: live TOTP authenticator + verify step */
function DemoMFA() {
  const period = 30;
  const secret = "JBSWY3DPEHPK3PXP";
  const [now, setNow] = useState(Date.now());
  const [entered, setEntered] = useState("");
  const [verified, setVerified] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const sec = Math.floor(now / 1000);
  const windowIdx = Math.floor(sec / period);
  const code = useMemo(() => {
    const h = sha256(secret + ":" + windowIdx);
    return (parseInt(h.slice(0, 8), 16) % 1000000).toString().padStart(6, "0");
  }, [windowIdx]);
  const remaining = period - (sec % period);
  const frac = remaining / period;

  // reset typed code each new window
  const prevWin = useRef(windowIdx);
  useEffect(() => {
    if (prevWin.current !== windowIdx) { prevWin.current = windowIdx; if (!verified) setEntered(""); }
  }, [windowIdx, verified]);

  const submit = (val) => {
    const v = (val ?? entered).replace(/\D/g, "").slice(0, 6);
    if (v.length === 6) {
      if (v === code) setVerified(true);
      else { setShake(true); setTimeout(() => setShake(false), 500); setTimeout(() => setEntered(""), 450); }
    }
  };

  const R = 26, C = 2 * Math.PI * R;

  return (
    <div className="demo-wrap mfa-wrap">
      <div className="mfa-factors">
        <div className="factor done"><span className="fic">{I.check}</span><div><b>Something you know</b><span className="glue">Password — already verified ✓</span></div></div>
        <div className="factor-plus">+</div>
        <div className={`factor ${verified ? "done" : "active"}`}><span className="fic">{verified ? I.check : I.phone}</span><div><b>Something you have</b><span className="glue">A one-time code from your phone</span></div></div>
      </div>

      <div className="mfa-stage">
        {/* authenticator */}
        <div className="auth-app">
          <div className="auth-app-top"><span className="ico-chip sm">{I.shield}</span> Authenticator</div>
          <div className="auth-account">Acme · kim@acme.dev</div>
          <div className="auth-code mono">{code.slice(0,3)}<span className="sp"> </span>{code.slice(3)}</div>
          <div className="auth-ring">
            <svg viewBox="0 0 60 60" width="60" height="60">
              <circle cx="30" cy="30" r={R} className="ring-bg" />
              <circle cx="30" cy="30" r={R} className={`ring-fg ${remaining<=5?"low":""}`}
                strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 30 30)" />
            </svg>
            <span className={`ring-num mono ${remaining<=5?"low":""}`}>{remaining}</span>
          </div>
          <div className="auth-hint">refreshes every 30s</div>
        </div>

        <div className="mfa-arrow">{I.arrow}</div>

        {/* verify */}
        <div className="mfa-verify card">
          {!verified ? (
            <React.Fragment>
              <h4>Enter the 6-digit code</h4>
              <div className="otp-field">
                <div className={`otp-boxes ${shake ? "shake" : ""}`}>
                  {[0,1,2,3,4,5].map((i) => (
                    <span key={i} className={`otp-box ${entered[i] ? "filled" : ""} ${entered.length===i?"caret":""}`}>{entered[i] || ""}</span>
                  ))}
                </div>
                <input className="otp-hidden" inputMode="numeric" value={entered} autoFocus
                  onChange={(e) => { const v = e.target.value.replace(/\D/g,"").slice(0,6); setEntered(v); if (v.length===6) submit(v); }} />
              </div>
              <div className="otp-actions">
                <button className="btn btn-ghost sm" onClick={() => { setEntered(code); submit(code); }}>autofill</button>
                <button className="btn btn-ghost sm" onClick={() => setEntered("000000")}>try a wrong one</button>
              </div>
              <p className="glue mfa-tip">Steal the password alone and you still can't get in — the attacker would also need the phone generating this code.</p>
            </React.Fragment>
          ) : (
            <div className="mfa-success">
              <div className="success-burst">{I.checkCircle}</div>
              <h4>You're in.</h4>
              <p className="glue">Two factors verified. Even a leaked password isn't enough on its own.</p>
              <button className="btn btn-ghost sm" onClick={() => { setVerified(false); setEntered(""); }}>{I.reset} Try again</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { DemoMFA });

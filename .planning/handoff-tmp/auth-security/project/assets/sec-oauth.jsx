/* Demo — OAuth: the redirect dance, stepped */
const OAUTH_NODES = {
  you:      { name: "You",       sub: "the browser",  icon: I.user,   color: "var(--pill-person)", x: 12 },
  app:      { name: "Acme",      sub: "the app",       icon: I.doc,    color: "var(--pill-object)", x: 50 },
  provider: { name: "Vault ID",  sub: "the provider",  icon: I.shield, color: "var(--pill-query)",  x: 88 },
};
const OAUTH_STEPS = [
  { from: "you", to: "app", label: "“Sign me in”", desc: "You click “Continue with Vault ID” inside the Acme app." },
  { from: "app", to: "provider", label: "redirect + client_id", desc: "Acme bounces your browser to Vault ID, passing its client_id, the scopes it wants, and a redirect URL. No password involved yet." },
  { from: "you", to: "provider", label: "password + consent", desc: "You log in and approve at Vault ID. Your password goes only to Vault ID — Acme never sees it." },
  { from: "provider", to: "app", label: "one-time auth code", desc: "Vault ID redirects your browser back to Acme carrying a short-lived authorization code." },
  { from: "app", to: "provider", label: "code + client_secret", desc: "Server-to-server, Acme swaps that code (plus its private secret) for a token. The browser never sees this exchange." },
  { from: "provider", to: "app", label: "access token", desc: "Vault ID returns an access token. Acme calls the API with it to load your profile. You're in — password never shared." },
];

function DemoOAuth() {
  const [step, setStep] = useState(-1); // -1 = idle
  const [pktX, setPktX] = useState(OAUTH_NODES.you.x);
  const [pktShow, setPktShow] = useState(false);
  const timers = useRef([]);

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => clear(), []);

  const go = (i) => {
    clear();
    if (i < 0 || i >= OAUTH_STEPS.length) { setStep(i); setPktShow(false); return; }
    const s = OAUTH_STEPS[i];
    setStep(i);
    setPktShow(false);
    setPktX(OAUTH_NODES[s.from].x);
    timers.current.push(setTimeout(() => { setPktShow(true); setPktX(OAUTH_NODES[s.to].x); }, 60));
  };

  const done = step >= OAUTH_STEPS.length - 1;
  const cur = step >= 0 && step < OAUTH_STEPS.length ? OAUTH_STEPS[step] : null;
  const active = cur ? [cur.from, cur.to] : [];

  return (
    <div className="demo-wrap oauth-wrap">
      <div className="oauth-track card">
        <div className="oauth-nodes">
          {Object.entries(OAUTH_NODES).map(([k, n]) => (
            <div key={k} className={`oauth-node ${active.includes(k) ? "active" : ""}`} style={{ left: n.x + "%" }}>
              <span className="on-ico" style={{ background: n.color }}>{n.icon}</span>
              <b>{n.name}</b><span className="glue">{n.sub}</span>
            </div>
          ))}
          <div className="oauth-line" />
          {pktShow && cur && (
            <div className="oauth-pkt" style={{ left: pktX + "%" }}>
              <span className="pkt-chip mono">{cur.label}</span>
            </div>
          )}
        </div>
      </div>

      <div className="oauth-readout">
        <div className="oauth-stepno mono">{step < 0 ? "ready" : done ? "done" : `step ${step + 1} / ${OAUTH_STEPS.length}`}</div>
        <p className="oauth-desc">
          {step < 0 ? "Watch how “Sign in with…” logs you in without ever handing your password to the app." : cur.desc}
        </p>
        {done && <div className="oauth-done"><span>{I.checkCircle}</span> Logged in — Acme holds a token, not your password.</div>}
      </div>

      <div className="oauth-ctrls">
        <button className="btn btn-ghost" onClick={() => go(step - 1)} disabled={step < 0}>Back</button>
        <div className="oauth-dots">
          {OAUTH_STEPS.map((_, i) => <span key={i} className={i <= step ? "on" : ""} />)}
        </div>
        {step < OAUTH_STEPS.length - 1
          ? <button className="btn btn-primary" onClick={() => go(step + 1)}>{step < 0 ? <React.Fragment>{I.play} Start the flow</React.Fragment> : <React.Fragment>Next {I.arrow}</React.Fragment>}</button>
          : <button className="btn btn-ghost" onClick={() => go(-1)}>{I.reset} Replay</button>}
      </div>
    </div>
  );
}
Object.assign(window, { DemoOAuth });

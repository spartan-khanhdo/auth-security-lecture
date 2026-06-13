/* Demo — Authentication vs Authorization: the two-gate flow */
function DemoAuthZ() {
  const [cred, setCred] = useState("valid");      // valid | wrong
  const [role, setRole] = useState("editor");     // owner | editor | viewer | none
  const [action, setAction] = useState("edit");   // view | edit | delete
  const [step, setStep] = useState(0);             // 0 idle, 1 authn, 2 authn-done, 3 authz, 4 done
  const timers = useRef([]);

  const allowed = useMemo(() => {
    const matrix = { view: ["viewer", "editor", "owner"], edit: ["editor", "owner"], delete: ["owner"] };
    return matrix[action].includes(role);
  }, [action, role]);

  const authnPass = cred === "valid";
  const authzPass = authnPass && allowed;

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => clear(), []);

  const run = () => {
    clear(); setStep(1);
    timers.current.push(setTimeout(() => setStep(2), 1100));
    if (authnPass) {
      timers.current.push(setTimeout(() => setStep(3), 1900));
      timers.current.push(setTimeout(() => setStep(4), 3000));
    }
  };
  const reset = () => { clear(); setStep(0); };

  const Seg = ({ value, set, options }) => (
    <div className="seg">
      {options.map((o) => (
        <button key={o.v} className={value === o.v ? "on" : ""} onClick={() => { set(o.v); reset(); }}>{o.l}</button>
      ))}
    </div>
  );

  const gateState = (which) => {
    if (which === "authn") {
      if (step < 1) return "idle";
      if (step === 1) return "checking";
      return authnPass ? "pass" : "fail";
    } else {
      if (step < 3) return authnPass ? (step >= 2 ? "wait" : "idle") : "blocked";
      if (step === 3) return "checking";
      return authzPass ? "pass" : "fail";
    }
  };

  return (
    <div className="demo-wrap">
      <div className="az-grid">
          {/* controls */}
          <div className="card az-controls">
            <div className="ctl">
              <label>The visitor claims to be</label>
              <div className="visitor"><Avatar name="Kim" size={30} /><b>Kim</b><span className="glue mono">@acme.dev</span></div>
            </div>
            <div className="ctl">
              <label>Credentials</label>
              <Seg value={cred} set={setCred} options={[{v:"valid",l:"✓ Correct password"},{v:"wrong",l:"✗ Wrong password"}]} />
            </div>
            <div className="ctl">
              <label>Kim's role on <span className="mono">doc:roadmap</span></label>
              <Seg value={role} set={setRole} options={[{v:"owner",l:"Owner"},{v:"editor",l:"Editor"},{v:"viewer",l:"Viewer"},{v:"none",l:"None"}]} />
            </div>
            <div className="ctl">
              <label>Trying to</label>
              <Seg value={action} set={setAction} options={[{v:"view",l:"View"},{v:"edit",l:"Edit"},{v:"delete",l:"Delete"}]} />
            </div>
            <div className="az-run">
              <button className="btn btn-primary" onClick={run} disabled={step !== 0}>{I.play} Attempt access</button>
              <button className="btn btn-ghost" onClick={reset}>{I.reset} Reset</button>
            </div>
          </div>

          {/* gates */}
          <div className="az-gates">            <Gate
              tone="authn" icon={I.fingerprint} title="Authentication" q="Who are you?"
              state={gateState("authn")}
              passMsg="Identity verified — that's really Kim."
              failMsg="Couldn't verify identity. Wrong password."
            />
            <div className={`az-link ${step >= 3 ? "lit" : ""}`}>{I.arrow}</div>
            <Gate
              tone="authz" icon={I.shield} title="Authorization" q={`Can you ${action}?`}
              state={gateState("authz")}
              passMsg={`Allowed — ${role} can ${action}.`}
              failMsg={authnPass ? `Denied — ${role === "none" ? "no role" : role} can't ${action}.` : "Never reached — failed at the door."}
            />
            <div className={`az-final ${step === 4 ? "show" : ""} ${authzPass ? "ok" : "no"}`}>
              <span className="fi">{authzPass ? I.checkCircle : I.x}</span>
              {authzPass ? "Access granted" : "Access denied"}
            </div>
          </div>
        </div>

        <div className="az-note">
          <span className="kbd">tip</span> Passing AuthN doesn't mean you're authorized — a verified viewer still can't delete. And being authorized is meaningless if you can't first prove who you are.
        </div>
      </div>
    );
}

function Gate({ tone, icon, title, q, state, passMsg, failMsg }) {
  return (
    <div className={`gate ${tone} st-${state}`}>
      <div className="gate-ico">{icon}</div>
      <div className="gate-head">
        <h4>{title}</h4>
        <p className="mono">{q}</p>
      </div>
      <div className="gate-result">
        {state === "checking" && <span className="checking"><i/><i/><i/> checking…</span>}
        {state === "pass" && <span className="rs ok">{I.check} {passMsg}</span>}
        {state === "fail" && <span className="rs no">{I.x} {failMsg}</span>}
        {(state === "blocked") && <span className="rs muted">— skipped</span>}
        {(state === "idle" || state === "wait") && <span className="rs muted">waiting…</span>}
      </div>
    </div>
  );
}

Object.assign(window, { DemoAuthZ });

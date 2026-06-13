/* Demo — Passwords & hashing: live strength + salted SHA-256 */
function DemoPasswords() {
  const [pw, setPw] = useState("hunter2");
  const [show, setShow] = useState(false);
  const s = useMemo(() => strength(pw), [pw]);
  const salts = { Alice: "x9f2", Bob: "k71q" };
  const plainHash = useMemo(() => (pw ? sha256(pw) : ""), [pw]);
  const hashFor = (salt) => (pw ? sha256(salt + ":" + pw) : "");

  const barColors = ["var(--red)", "var(--orange)", "var(--amber)", "var(--green)", "var(--green)"];

  return (
    <div className="demo-wrap pw-wrap">
      <div className="pw-input card">
        <label className="pw-label">Type a password — nothing leaves your browser</label>
        <div className="pw-field">
          <span className="pw-ico">{I.lock}</span>
          <input
            type={show ? "text" : "password"}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="try something…"
            spellCheck="false" autoComplete="off"
          />
          <button className="pw-eye" onClick={() => setShow((v) => !v)} title={show ? "hide" : "show"}>
            {show ? I.eye : I.eye}
          </button>
        </div>
        <div className="pw-meter">
          <div className="pw-bars">
            {[0,1,2,3].map((i) => (
              <span key={i} style={{ background: i < s.score ? barColors[s.score] : "var(--surface-3)" }} />
            ))}
          </div>
          <div className="pw-stats">
            <span className="pw-strength" style={{ color: s.score >= 3 ? "var(--green)" : s.score >= 2 ? "var(--amber)" : "var(--red)" }}>{s.label}</span>
            <span className="glue">·</span>
            <span className="mono">{s.bits} bits entropy</span>
            <span className="glue">·</span>
            <span>cracked in <b className="mono">{s.crack}</b></span>
          </div>
        </div>
      </div>

      <div className="pw-store">
        <div className="storecard bad">
          <div className="storecard-h">
            <span className="tag no">{I.x} never do this</span>
            <h4>Stored as plaintext</h4>
          </div>
          <code className="storeval danger">{pw || "—"}</code>
          <p>If the database leaks, every password is exposed — instantly reusable on other sites.</p>
        </div>

        <div className="storecard good">
          <div className="storecard-h">
            <span className="tag ok">{I.check} the right way</span>
            <h4>Stored as a salted hash</h4>
          </div>
          <code className="storeval">{plainHash ? plainHash.slice(0, 48) + "…" : "—"}</code>
          <p>A one-way function. You can verify a login by re-hashing, but you can <em>never</em> turn the hash back into the password.</p>
        </div>
      </div>

      <div className="pw-salt card">
        <div className="pw-salt-h">
          <span className="ico-chip">{I.hash}</span>
          <div>
            <h4>Why “salt”?</h4>
            <p className="glue">Alice and Bob picked the <b>same</b> password — but a unique random salt makes their stored hashes completely different. Attackers can't crack them in bulk.</p>
          </div>
        </div>
        <div className="salt-rows">
          {["Alice", "Bob"].map((u) => (
            <div className="salt-row" key={u}>
              <Avatar name={u === "Alice" ? "Mei" : "Carl"} size={26} />
              <b>{u}</b>
              <span className="salt-chip mono">salt: {salts[u]}</span>
              <span className="arrow-mini">{I.arrow}</span>
              <code className="salt-hash mono">{hashFor(salts[u]).slice(0, 24)}…</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { DemoPasswords });

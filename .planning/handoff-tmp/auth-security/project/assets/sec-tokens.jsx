/* Demo — Tokens & sessions: live JWT builder + decoder */
function b64url(obj) {
  const json = typeof obj === "string" ? obj : JSON.stringify(obj);
  return btoa(unescape(encodeURIComponent(json))).replace(/=+$/,"").replace(/\+/g,"-").replace(/\//g,"_");
}

function DemoTokens() {
  const [role, setRole] = useState("editor");
  const [life, setLife] = useState("1h"); // 15m | 1h | exp
  const [issuedAt, setIssuedAt] = useState(Math.floor(Date.now() / 1000));
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const ttl = life === "15m" ? 900 : life === "1h" ? 3600 : -120;
  const exp = issuedAt + ttl;
  const valid = now < exp;
  const remaining = exp - now;

  const header = { alg: "HS256", typ: "JWT" };
  const payload = { sub: "kim@acme.dev", name: "Kim", role, iat: issuedAt, exp };
  const hB = b64url(header), pB = b64url(payload);
  const sig = sha256("s3cr3t-key." + hB + "." + pB).slice(0, 43);

  const reissue = () => { setIssuedAt(Math.floor(Date.now() / 1000)); };

  const fmtRemain = () => {
    if (remaining <= 0) return "expired " + (-remaining) + "s ago";
    if (remaining > 3600) return Math.floor(remaining / 3600) + "h " + Math.floor((remaining % 3600) / 60) + "m left";
    if (remaining > 60) return Math.floor(remaining / 60) + "m " + (remaining % 60) + "s left";
    return remaining + "s left";
  };

  const Seg = ({ value, set, options }) => (
    <div className="seg">{options.map((o) => <button key={o.v} className={value===o.v?"on":""} onClick={()=>{set(o.v); if(o.v!=="exp") reissue();}}>{o.l}</button>)}</div>
  );

  return (
    <div className="demo-wrap tok-wrap">
      <div className="tok-controls card">
        <div className="ctl"><label>Role claim baked into the token</label>
          <Seg value={role} set={setRole} options={[{v:"viewer",l:"viewer"},{v:"editor",l:"editor"},{v:"owner",l:"owner"}]} />
        </div>
        <div className="ctl"><label>Lifetime</label>
          <Seg value={life} set={(v)=>{setLife(v); if(v!=="exp") reissue();}} options={[{v:"15m",l:"15 min"},{v:"1h",l:"1 hour"},{v:"exp",l:"already expired"}]} />
        </div>
        <button className="btn btn-primary" onClick={reissue}>{I.reset} Re-issue token</button>
        <div className={`tok-validity ${valid ? "ok" : "no"}`}>
          <span>{valid ? I.checkCircle : I.x}</span>
          <div>
            <b>{valid ? "Token accepted" : "Token rejected"}</b>
            <span className="mono">{fmtRemain()}</span>
          </div>
        </div>
      </div>

      <div className="tok-main">
        <div className="tok-jwt card">
          <div className="tok-jwt-h"><span className="ico-chip">{I.ticket}</span> The encoded JWT <span className="glue">— sent on every request</span></div>
          <div className="jwt-string mono">
            <span className="seg-h">{hB}</span><span className="dot">.</span>
            <span className="seg-p">{pB}</span><span className="dot">.</span>
            <span className="seg-s">{sig}</span>
          </div>
          <div className="jwt-legend">
            <span><i className="sw h"/>header</span>
            <span><i className="sw p"/>payload</span>
            <span><i className="sw s"/>signature</span>
          </div>
        </div>

        <div className="tok-decoded">
          <div className="dec card">
            <div className="dec-h"><i className="sw h"/> HEADER <span className="glue">algorithm &amp; type</span></div>
            <pre className="mono">{JSON.stringify(header, null, 2)}</pre>
          </div>
          <div className="dec card">
            <div className="dec-h"><i className="sw p"/> PAYLOAD <span className="glue">claims</span></div>
            <pre className="mono">{JSON.stringify(payload, null, 2).replace(`${exp}`, `${exp}  // ${valid ? "future" : "past"}`)}</pre>
          </div>
        </div>
        <p className="tok-note"><span className="kbd">note</span> The signature is a fingerprint of header + payload, signed with a secret only the server knows. Change one character of the payload and the signature no longer matches — so a client can read a JWT, but can't forge one.</p>
      </div>
    </div>
  );
}
Object.assign(window, { DemoTokens });

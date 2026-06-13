/* Demo — Relationship-based access (ReBAC / Zanzibar-style playground) */
const RBAC_ROLES = ["owner", "editor", "viewer"]; // strongest -> weakest
const RBAC_IMPLIES = { owner: ["owner", "editor", "viewer"], editor: ["editor", "viewer"], viewer: ["viewer"] };
const RBAC_USERS = ["Kim", "Ben", "Carl", "Mei"];
const RBAC_OBJECTS = ["doc:roadmap", "doc:slides"];
const ROLE_ICON = { owner: I.key, editor: I.pencil, viewer: I.eye };

function rbacCheck(tuples, user, rel, obj) {
  const direct = tuples.filter((t) => t.user === user && t.object === obj).map((t) => t.relation);
  for (const r of RBAC_ROLES) {
    if (direct.includes(r) && RBAC_IMPLIES[r].includes(rel)) return { ok: true, via: r, direct };
  }
  return { ok: false, via: null, direct };
}

function DemoRBAC() {
  const [tuples, setTuples] = useState([
    { user: "Kim", relation: "owner", object: "doc:roadmap" },
    { user: "Ben", relation: "editor", object: "doc:roadmap" },
    { user: "Carl", relation: "editor", object: "doc:slides" },
    { user: "Mei", relation: "viewer", object: "doc:roadmap" },
  ]);
  const [qUser, setQUser] = useState("Carl");
  const [qRel, setQRel] = useState("viewer");
  const [qObj, setQObj] = useState("doc:slides");

  // add-tuple draft
  const [nUser, setNUser] = useState("Mei");
  const [nRel, setNRel] = useState("editor");
  const [nObj, setNObj] = useState("doc:slides");

  const result = useMemo(() => rbacCheck(tuples, qUser, qRel, qObj), [tuples, qUser, qRel, qObj]);

  const addTuple = () => {
    if (tuples.some((t) => t.user === nUser && t.relation === nRel && t.object === nObj)) return;
    setTuples((t) => [...t, { user: nUser, relation: nRel, object: nObj }]);
  };
  const removeTuple = (i) => setTuples((t) => t.filter((_, k) => k !== i));

  // previewer: roles for the queried object
  const usersByRole = (role) => tuples.filter((t) => t.object === qObj && t.relation === role).map((t) => t.user);
  const qViaIndex = result.via ? RBAC_ROLES.indexOf(result.via) : -1;
  const qRelIndex = RBAC_ROLES.indexOf(qRel);

  const Dd = ({ value, set, options, kind }) => (
    <select className={`rbac-dd ${kind}`} value={value} onChange={(e) => set(e.target.value)}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <div className="demo-wrap rbac-wrap">
      <div className="rbac-grid">
        {/* NAMESPACE */}
        <div className="rbac-cell card">
          <div className="cell-h">NAMESPACE</div>
          <pre className="rbac-ns mono">
{`name: `}<span className="s">"doc"</span>{`
relation { name: `}<span className="s">"owner"</span>{`  }
relation { name: `}<span className="s">"editor"</span>{` }
  `}<span className="c">// owner implies editor</span>{`
relation { name: `}<span className="s">"viewer"</span>{` }
  `}<span className="c">// editor implies viewer</span></pre>
        </div>

        {/* PREVIEWER */}
        <div className="rbac-cell card">
          <div className="cell-h">PREVIEWER <span className="glue">· {qObj}</span></div>
          <div className="prev-graph">
            <div className="prev-chain">
              {RBAC_ROLES.map((role, i) => {
                const onPath = result.ok && i >= qViaIndex && i <= qRelIndex;
                const isTarget = role === qRel;
                const isVia = role === result.via;
                return (
                  <React.Fragment key={role}>
                    <div className={`prev-role ${onPath ? "lit" : ""} ${isTarget ? "target" : ""}`}>
                      <span className="pr-node" style={{ background: "var(--pill-role)" }}>{ROLE_ICON[role]}</span>
                      <span className="pr-name">{role}</span>
                      <div className="pr-users">
                        {usersByRole(role).map((u) => (
                          <span key={u} className={`pr-ava ${isVia && u === qUser ? "you" : ""}`}><Avatar name={u} size={24} /></span>
                        ))}
                      </div>
                    </div>
                    {i < RBAC_ROLES.length - 1 && <div className={`prev-arrow ${result.ok && i + 1 > qViaIndex && i + 1 <= qRelIndex ? "lit" : ""}`}>{I.arrow}</div>}
                  </React.Fragment>
                );
              })}
            </div>
            <div className="prev-legend glue">→ “implies”: an owner is also an editor, an editor is also a viewer.</div>
          </div>
        </div>

        {/* TUPLES */}
        <div className="rbac-cell card">
          <div className="cell-h">TUPLES <span className="glue">· the facts</span></div>
          <div className="tuple-list">
            {tuples.map((t, i) => (
              <div className="tuple-row" key={i}>
                <Pill kind="person" person={t.user}>{t.user}</Pill>
                <span className="glue">is</span>
                <Pill kind="role" icon={ROLE_ICON[t.relation]}>{t.relation}</Pill>
                <span className="glue">of</span>
                <Pill kind="object" icon={I.doc}>{t.object}</Pill>
                <button className="tuple-x" onClick={() => removeTuple(i)} title="remove">{I.x}</button>
              </div>
            ))}
          </div>
          <div className="tuple-add">
            <Dd value={nUser} set={setNUser} options={RBAC_USERS} kind="person" />
            <Dd value={nRel} set={setNRel} options={RBAC_ROLES} kind="role" />
            <Dd value={nObj} set={setNObj} options={RBAC_OBJECTS} kind="object" />
            <button className="btn btn-primary sm" onClick={addTuple}>+ add</button>
          </div>
        </div>

        {/* QUERY */}
        <div className="rbac-cell card">
          <div className="cell-h">QUERY <span className="glue">· ask anything</span></div>
          <div className="query-line">
            <span className="ico-chip sm">{I.question}</span> Is
            <Dd value={qUser} set={setQUser} options={RBAC_USERS} kind="person" />
            a
            <Dd value={qRel} set={setQRel} options={RBAC_ROLES} kind="role" />
            of
            <Dd value={qObj} set={setQObj} options={RBAC_OBJECTS} kind="object" /> ?
          </div>
          <div className={`query-answer ${result.ok ? "yes" : "no"}`} key={`${qUser}-${qRel}-${qObj}-${result.ok}`}>
            <span className="qa-ico">{result.ok ? I.checkCircle : I.x}</span>
            <div className="qa-text">
              <b>{result.ok ? "Yes" : "No"} — {qUser} {result.ok ? "is" : "is not"} a {qRel} of {qObj}</b>
              <span className="glue">
                {result.ok
                  ? (result.via === qRel
                      ? `Direct tuple: ${qUser} is ${qRel} of ${qObj}.`
                      : `${qUser} is ${result.via} of ${qObj}, and ${result.via} implies ${qRel}.`)
                  : `No tuple grants ${qUser} a role that implies ${qRel} on ${qObj}.`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { DemoRBAC });

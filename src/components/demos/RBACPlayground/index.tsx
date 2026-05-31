"use client";

import { useState, useMemo, useCallback } from "react";
import { Key, Pencil, Eye, Plus, X, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import type { ReactNode } from "react";
import DemoFrame from "@/components/demos/_shared/DemoFrame";
import {
  rbacCheck,
  RELATIONS,
  IMPLIES,
  DEFAULT_TUPLES,
  USERS,
  OBJECTS,
  type Tuple,
  type Relation,
} from "./policyEngine";

const ROLE_ICONS: Record<Relation, ReactNode> = {
  owner:  <Key  size={18} />,
  editor: <Pencil size={18} />,
  viewer: <Eye  size={18} />,
};

export default function RBACPlayground() {
  const [tuples, setTuples] = useState<Tuple[]>(DEFAULT_TUPLES);

  // Query state
  const [qUser, setQUser] = useState("Carl");
  const [qRel,  setQRel]  = useState<Relation>("viewer");
  const [qObj,  setQObj]  = useState("doc:slides");

  // Add-tuple draft
  const [nUser, setNUser] = useState<string>(USERS[0]);
  const [nRel,  setNRel]  = useState<Relation>("editor");
  const [nObj,  setNObj]  = useState<string>(OBJECTS[0]);

  const result = useMemo(() => rbacCheck(tuples, qUser, qRel, qObj), [tuples, qUser, qRel, qObj]);

  const addTuple = useCallback(() => {
    if (tuples.some((t) => t.user === nUser && t.relation === nRel && t.object === nObj)) return;
    setTuples((t) => [...t, { user: nUser, relation: nRel, object: nObj }]);
  }, [tuples, nUser, nRel, nObj]);

  const removeTuple = useCallback((i: number) => {
    setTuples((t) => t.filter((_, k) => k !== i));
  }, []);

  const handleReset = useCallback(() => {
    setTuples(DEFAULT_TUPLES);
    setQUser("Carl");
    setQRel("viewer");
    setQObj("doc:slides");
  }, []);

  // For the previewer: which users hold each role on the queried object
  const usersByRole = (role: Relation) =>
    tuples.filter((t) => t.object === qObj && t.relation === role).map((t) => t.user);

  const qViaIndex = result.via ? RELATIONS.indexOf(result.via) : -1;
  const qRelIndex = RELATIONS.indexOf(qRel);

  return (
    <DemoFrame
      title="RBAC Playground"
      subtitle="Add / remove tuples to see how role implication resolves access decisions"
      onReset={handleReset}
      footerNote="RBAC (role-based access control) stores 'user X is role R on object O' tuples. Role implication means an owner is also an editor and a viewer — so checking any of those resolves transitively."
    >
      <div className="rbac-wrap">
        <div className="rbac-grid">
          {/* ── Namespace card ── */}
          <div className="rbac-cell">
            <div className="cell-h">NAMESPACE</div>
            <pre className="rbac-ns mono">
{`name: `}<span className="s">&ldquo;doc&rdquo;</span>{`
relation { name: `}<span className="s">&ldquo;owner&rdquo;</span>{`  }
relation { name: `}<span className="s">&ldquo;editor&rdquo;</span>{` }
  `}<span className="c">&#47;&#47; owner implies editor</span>{`
relation { name: `}<span className="s">&ldquo;viewer&rdquo;</span>{` }
  `}<span className="c">&#47;&#47; editor implies viewer</span>
            </pre>
            <div className="mt-3 text-xs text-[var(--text-faint)] leading-relaxed">
              Implication chain: <span className="font-semibold text-[var(--text)]">owner</span> &rsaquo; <span className="font-semibold text-[var(--text)]">editor</span> &rsaquo; <span className="font-semibold text-[var(--text)]">viewer</span>
            </div>
            <div className="mt-2 flex flex-col gap-1">
              {RELATIONS.map((r) => (
                <div key={r} className="flex items-center gap-2 text-xs text-[var(--text-dim)]">
                  <span style={{ color: "var(--pill-role)" }}>{ROLE_ICONS[r]}</span>
                  <span className="font-semibold capitalize">{r}</span>
                  <span className="text-[var(--text-faint)]">
                    implies: {IMPLIES[r].join(", ")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Previewer card ── */}
          <div className="rbac-cell">
            <div className="cell-h">PREVIEWER <span className="glue">· {qObj}</span></div>
            <div className="prev-graph">
              <div className="prev-chain">
                {RELATIONS.map((role, i) => {
                  const onPath = result.ok && i >= qViaIndex && i <= qRelIndex;
                  const isTarget = role === qRel;
                  return (
                    <div key={role} className="flex items-center flex-1 gap-0">
                      <div className={`prev-role flex-1 ${onPath ? "lit" : ""} ${isTarget ? "target" : ""}`}>
                        <span className="pr-node" style={{ background: "var(--pill-role)" }}>{ROLE_ICONS[role]}</span>
                        <span className="pr-name">{role}</span>
                        <div className="pr-users">
                          {usersByRole(role).map((u) => (
                            <span
                              key={u}
                              className={`pr-ava ${result.ok && result.via === role && u === qUser ? "you" : ""}`}
                              title={u}
                            >
                              <span
                                style={{
                                  width: 24, height: 24, borderRadius: "50%",
                                  background: "var(--surface-3)", display: "flex",
                                  alignItems: "center", justifyContent: "center",
                                  fontSize: 10, fontWeight: 700, color: "var(--text-dim)",
                                }}
                              >
                                {u[0]}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                      {i < RELATIONS.length - 1 && (
                        <div className={`prev-arrow ${result.ok && i + 1 > qViaIndex && i + 1 <= qRelIndex ? "lit" : ""}`}>
                          &rarr;
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="prev-legend">
                &rarr; &ldquo;implies&rdquo;: an owner is also an editor, an editor is also a viewer.
              </div>
            </div>
          </div>

          {/* ── Tuples card ── */}
          <div className="rbac-cell">
            <div className="cell-h">TUPLES <span className="glue">· the facts</span></div>
            <div className="tuple-list">
              {tuples.map((t, i) => (
                <div className="tuple-row" key={i}>
                  <UserPill>{t.user}</UserPill>
                  <span className="glue text-xs">is</span>
                  <RolePill icon={ROLE_ICONS[t.relation]}>{t.relation}</RolePill>
                  <span className="glue text-xs">of</span>
                  <ObjectPill>{t.object}</ObjectPill>
                  <button className="tuple-x" onClick={() => removeTuple(i)} title="remove">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="tuple-add">
              <Select
                value={nUser}
                onChange={(v) => setNUser(v)}
                options={USERS}
                kind="person"
              />
              <Select
                value={nRel}
                onChange={(v) => setNRel(v as Relation)}
                options={[...RELATIONS]}
                kind="role"
              />
              <Select
                value={nObj}
                onChange={(v) => setNObj(v)}
                options={OBJECTS}
                kind="object"
              />
              <button
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white hover:opacity-90 cursor-pointer"
                onClick={addTuple}
              >
                <Plus size={12} />
                add
              </button>
            </div>
          </div>

          {/* ── Query card ── */}
          <div className="rbac-cell">
            <div className="cell-h">QUERY <span className="glue">· ask anything</span></div>
            <div className="query-line">
              <HelpCircle size={18} className="ico-chip sm" />
              <span>Is</span>
              <Select value={qUser} onChange={(v) => setQUser(v)} options={USERS} kind="person" />
              <span>a</span>
              <Select value={qRel} onChange={(v) => setQRel(v as Relation)} options={[...RELATIONS]} kind="role" />
              <span>of</span>
              <Select value={qObj} onChange={(v) => setQObj(v)} options={OBJECTS} kind="object" />
              <span>?</span>
            </div>
            <div
              key={`${qUser}-${qRel}-${qObj}-${result.ok}`}
              className={`query-answer ${result.ok ? "yes" : "no"}`}
            >
              <span className="qa-ico">
                {result.ok ? (
                  <CheckCircle size={24} />
                ) : (
                  <XCircle size={24} />
                )}
              </span>
              <div className="qa-text">
                <b>
                  {result.ok ? "Yes" : "No"} — {qUser}{" "}
                  {result.ok ? "is" : "is not"} a {qRel} of {qObj}
                </b>
                <span className="glue">
                  {result.ok
                    ? result.via === qRel
                      ? `Direct tuple: ${qUser} is ${qRel} of ${qObj}.`
                      : `${qUser} is ${result.via} of ${qObj}, and ${result.via} implies ${qRel}.`
                    : `No tuple grants ${qUser} a role that implies ${qRel} on ${qObj}.`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}

// ─── Pill sub-components ──────────────────────────────────────────────────────

function UserPill({ children }: { children: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: "color-mix(in srgb, var(--pill-person) 18%, transparent)", color: "var(--pill-person)" }}
    >
      {children}
    </span>
  );
}

function RolePill({ children, icon }: { children: string; icon: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: "color-mix(in srgb, var(--pill-role) 18%, transparent)", color: "var(--pill-role)" }}
    >
      {icon}
      {children}
    </span>
  );
}

function ObjectPill({ children }: { children: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-mono"
      style={{ background: "color-mix(in srgb, var(--pill-object) 18%, transparent)", color: "var(--pill-object)" }}
    >
      {children}
    </span>
  );
}

function Select({
  value,
  onChange,
  options,
  kind,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  kind: "person" | "role" | "object";
}) {
  return (
    <select
      className={`rbac-dd ${kind}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

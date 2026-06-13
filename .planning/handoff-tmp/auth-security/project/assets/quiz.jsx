/* Quiz Engine — Kahoot-style live review across all 6 lectures.
   Uses BroadcastChannel for cross-tab multiplayer in the same browser.
   Host can add bot players for instant solo demos. */

const QUIZ_TIME   = 20;
const QUIZ_COLORS = ["#57a9ff", "#8b7cf6", "#ef7ee4", "#ff9166"];
const QUIZ_LABELS = ["A", "B", "C", "D"];
const BOT_NAMES   = ["Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Drew"];

const genCode = () => Math.random().toString(36).slice(2, 6).toUpperCase();
const genId   = () => Math.random().toString(36).slice(2, 10);

// ── Timer ring ───────────────────────────────────────────────
function TimerRing({ value, max }) {
  const r = 39, c = 2 * Math.PI * r;
  const pct = value / max;
  const col = pct > .5 ? "var(--green)" : pct > .25 ? "var(--amber)" : "var(--red)";
  return (
    <div className="qz-ring">
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="9" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={col} strokeWidth="9"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 1s linear, stroke .3s" }} />
      </svg>
      <span className="qz-ring-n" style={{ color: col }}>{value}</span>
    </div>
  );
}

// ── Answer grid (shared by host + player) ────────────────────
function AnswerGrid({ opts, chosen, correct, showCorrect, onChoose, disabled, counts }) {
  return (
    <div className="qz-opts">
      {opts.map((opt, i) => (
        <button key={i}
          className={`qz-opt${chosen === i ? " chosen" : ""}${showCorrect && i === correct ? " correct" : ""}${showCorrect && i !== correct ? " wrong" : ""}`}
          style={{ "--oc": QUIZ_COLORS[i] }}
          onClick={() => onChoose && onChoose(i)}
          disabled={disabled}>
          <span className="qz-opt-lbl">{QUIZ_LABELS[i]}</span>
          <span className="qz-opt-txt">{opt}</span>
          {counts != null && <span className="qz-opt-cnt">{counts[i] || 0}</span>}
        </button>
      ))}
    </div>
  );
}

// ── HOST ─────────────────────────────────────────────────────
function QuizHost({ onExit }) {
  const [phase,    setPhase]    = useState("lobby");
  const [players,  setPlayers]  = useState([]);
  const [qi,       setQi]       = useState(0);
  const [timer,    setTimer]    = useState(QUIZ_TIME);
  const [answers,  setAnswers]  = useState({});
  const [revealed, setRevealed] = useState(false);
  const [code]    = useState(genCode);

  const channelRef  = useRef(null);
  const timerRef    = useRef(null);
  const answersRef  = useRef({});
  const playersRef  = useRef([]);

  const qs = QUIZ_QUESTIONS;
  const q  = qs[qi];

  useEffect(() => { playersRef.current = players; }, [players]);

  // BroadcastChannel setup
  useEffect(() => {
    const ch = new BroadcastChannel(`authsec-quiz-${code}`);
    channelRef.current = ch;
    ch.onmessage = ({ data }) => {
      if (data.type === "JOIN") {
        setPlayers(ps => {
          if (ps.find(p => p.id === data.playerId)) return ps;
          const next = [...ps, { id: data.playerId, name: data.playerName, score: 0 }];
          ch.postMessage({ type: "PLAYER_LIST", players: next });
          playersRef.current = next;
          return next;
        });
      }
      if (data.type === "ANSWER") {
        const entry = { answerIndex: data.answerIndex, timeRemaining: data.timeRemaining };
        answersRef.current = { ...answersRef.current, [data.playerId]: entry };
        setAnswers({ ...answersRef.current });
      }
    };
    return () => { ch.close(); clearInterval(timerRef.current); };
  }, [code]);

  const broadcast = msg => channelRef.current?.postMessage(msg);

  const startQuestion = idx => {
    answersRef.current = {};
    setAnswers({});
    setRevealed(false);
    setQi(idx);
    setTimer(QUIZ_TIME);
    setPhase("question");
    broadcast({ type: "QUESTION", questionData: qs[idx], questionIndex: idx, total: qs.length, timeLimit: QUIZ_TIME });
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); doReveal(idx); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const doReveal = idx => {
    clearInterval(timerRef.current);
    const correctIdx = qs[idx].c;
    const ans = answersRef.current;
    setPlayers(ps => {
      const next = ps.map(p => {
        const a = ans[p.id];
        if (a && a.answerIndex === correctIdx) {
          const pts = Math.round((a.timeRemaining / QUIZ_TIME) * 800) + 200;
          return { ...p, score: p.score + pts };
        }
        return p;
      });
      broadcast({ type: "REVEAL", correctIndex: correctIdx, players: next });
      return next;
    });
    setRevealed(true);
    setPhase("reveal");
  };

  const nextQ = () => {
    if (qi + 1 < qs.length) {
      startQuestion(qi + 1);
    } else {
      setPhase("finished");
      const sorted = [...playersRef.current].sort((a, b) => b.score - a.score);
      broadcast({ type: "GAME_END", players: sorted });
    }
  };

  const addBot = () => {
    const name = BOT_NAMES[players.length % BOT_NAMES.length];
    const bot  = { id: "bot-" + genId(), name, score: 0, isBot: true };
    setPlayers(ps => { const next = [...ps, bot]; playersRef.current = next; return next; });
  };

  // Simulate bot answers
  useEffect(() => {
    if (phase !== "question") return;
    const bots = playersRef.current.filter(p => p.isBot);
    const tids = bots.map(bot => {
      const delay = 1800 + Math.random() * (QUIZ_TIME - 5) * 1000;
      return setTimeout(() => {
        const right = Math.random() > 0.38;
        const wrong = [0, 1, 2, 3].filter(i => i !== q.c);
        const ans   = right ? q.c : wrong[Math.floor(Math.random() * wrong.length)];
        const tr    = Math.max(0, QUIZ_TIME - delay / 1000);
        answersRef.current = { ...answersRef.current, [bot.id]: { answerIndex: ans, timeRemaining: tr } };
        setAnswers({ ...answersRef.current });
      }, delay);
    });
    return () => tids.forEach(clearTimeout);
  }, [phase, qi]);

  const sorted    = [...players].sort((a, b) => b.score - a.score);
  const ansCount  = Object.keys(answers).length;
  const optCounts = QUIZ_LABELS.map((_, i) => Object.values(answers).filter(a => a.answerIndex === i).length);

  return (
    <div className="qz-host">
      {/* ── Lobby ── */}
      {phase === "lobby" && (
        <div className="qz-lobby">
          <div className="qzl-code-card">
            <div className="qzl-lbl mono">JOIN CODE</div>
            <div className="qzl-code">{code}</div>
            <div className="qzl-hint">Open another tab → Join Quiz → enter this code</div>
          </div>
          <div>
            <div className="qzlp-hd">
              <span>{players.length} player{players.length !== 1 ? "s" : ""} waiting</span>
              <button className="btn btn-ghost qzl-add-bot" onClick={addBot}>+ Bot</button>
            </div>
            <div className="qzlp-chips">
              {players.map(p => (
                <span key={p.id} className="qzlp-chip">
                  <span className="qzlp-ava">{p.name[0].toUpperCase()}</span>
                  {p.name}{p.isBot ? " 🤖" : ""}
                </span>
              ))}
              {!players.length && <span className="qzlp-empty">Waiting for players…</span>}
            </div>
          </div>
          <div className="qzl-foot">
            <button className="btn btn-ghost" onClick={onExit}>Cancel</button>
            <button className="btn btn-primary" onClick={() => startQuestion(0)} disabled={!players.length}>
              {I.play} Start ({qs.length} questions)
            </button>
          </div>
        </div>
      )}

      {/* ── Question / Reveal ── */}
      {(phase === "question" || phase === "reveal") && q && (
        <div className="qz-game-host">
          <div className="qzg-hd">
            <span className="qzg-prog">Q {qi + 1} / {qs.length}</span>
            <span className="qzg-codebadge">#{code}</span>
            <span className="qzg-count">{ansCount} / {players.length} answered</span>
          </div>
          <div className="qzg-question">{q.q}</div>
          {phase === "question" && <div className="qzg-ring-wrap"><TimerRing value={timer} max={QUIZ_TIME} /></div>}
          <AnswerGrid opts={q.opts} correct={q.c} showCorrect={revealed}
            disabled counts={revealed ? optCounts : null} />
          {revealed && (
            <div className="qzg-reveal">
              <div className="qzg-exp">{q.exp}</div>
              <button className="btn btn-primary" onClick={nextQ}>
                {qi + 1 < qs.length
                  ? <React.Fragment>Next question {I.arrow}</React.Fragment>
                  : <React.Fragment>Final results {I.arrow}</React.Fragment>}
              </button>
            </div>
          )}
          {!revealed && (
            <div className="qzg-foot">
              <button className="btn btn-ghost" onClick={() => doReveal(qi)}>Show answer</button>
            </div>
          )}
        </div>
      )}

      {/* ── Finished ── */}
      {phase === "finished" && (
        <div className="qz-podium">
          <div className="qzp-title">🏆 Final Leaderboard</div>
          <div className="qzp-board">
            {sorted.map((p, i) => (
              <div key={p.id} className={`qzp-row${i < 3 ? ` top-${i}` : ""}`}>
                <span className="qzp-medal">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
                <span className="qzp-name">{p.name}</span>
                <span className="qzp-pts">{p.score.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={onExit}>Back to course</button>
        </div>
      )}
    </div>
  );
}

// ── PLAYER ────────────────────────────────────────────────────
function QuizPlayer({ onExit }) {
  const [phase,      setPhase]      = useState("join");
  const [code,       setCode]       = useState("");
  const [name,       setName]       = useState("");
  const [score,      setScore]      = useState(0);
  const [q,          setQ]          = useState(null);
  const [qi,         setQi]         = useState(0);
  const [total,      setTotal]      = useState(0);
  const [chosen,     setChosen]     = useState(null);
  const [correct,    setCorrect]    = useState(null);
  const [timer,      setTimer]      = useState(QUIZ_TIME);
  const [lastPts,    setLastPts]    = useState(0);
  const [finalBoard, setFinalBoard] = useState([]);

  const [playerId]   = useState(genId);
  const channelRef   = useRef(null);
  const timerRef     = useRef(null);
  const timerValRef  = useRef(QUIZ_TIME);
  const chosenRef    = useRef(null);
  const ansTimeRef   = useRef(QUIZ_TIME);

  useEffect(() => () => { channelRef.current?.close(); clearInterval(timerRef.current); }, []);

  const join = () => {
    if (!code.trim() || !name.trim()) return;
    const ch = new BroadcastChannel(`authsec-quiz-${code.trim().toUpperCase()}`);
    channelRef.current = ch;

    ch.onmessage = ({ data }) => {
      if (data.type === "QUESTION") {
        chosenRef.current  = null;
        ansTimeRef.current = data.timeLimit;
        timerValRef.current = data.timeLimit;
        setQ(data.questionData);
        setQi(data.questionIndex);
        setTotal(data.total);
        setChosen(null);
        setCorrect(null);
        setTimer(data.timeLimit);
        setPhase("question");
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          timerValRef.current = Math.max(0, timerValRef.current - 1);
          setTimer(timerValRef.current);
          if (timerValRef.current <= 0) { clearInterval(timerRef.current); setPhase("answered"); }
        }, 1000);
      }
      if (data.type === "REVEAL") {
        clearInterval(timerRef.current);
        const c   = data.correctIndex;
        const pts = (chosenRef.current !== null && chosenRef.current === c)
          ? Math.round((ansTimeRef.current / QUIZ_TIME) * 800) + 200 : 0;
        setCorrect(c);
        setLastPts(pts);
        setScore(s => s + pts);
        setPhase("reveal");
      }
      if (data.type === "GAME_END") { setFinalBoard(data.players); setPhase("finished"); }
    };

    ch.postMessage({ type: "JOIN", playerId, playerName: name.trim() });
    setPhase("waiting");
  };

  const answer = idx => {
    if (chosenRef.current !== null) return;
    chosenRef.current  = idx;
    ansTimeRef.current = timerValRef.current;
    setChosen(idx);
    channelRef.current?.postMessage({ type: "ANSWER", playerId, answerIndex: idx, timeRemaining: timerValRef.current });
    setPhase("answered");
    clearInterval(timerRef.current);
  };

  const myRank = finalBoard.findIndex(p => p.id === playerId) + 1;

  return (
    <div className="qz-player">
      {/* ── Join ── */}
      {phase === "join" && (
        <div className="qzp-join">
          <div className="qzpj-title">Join Quiz</div>
          <input className="qz-input" placeholder="Room code (e.g. XK3F)"
            value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} />
          <input className="qz-input" placeholder="Your name"
            value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && join()} />
          <button className="btn btn-primary" onClick={join} disabled={!code.trim() || !name.trim()}>
            Join →
          </button>
          <button className="btn btn-ghost" onClick={onExit}>← Back</button>
        </div>
      )}

      {/* ── Waiting ── */}
      {phase === "waiting" && (
        <div className="qzp-wait">
          <div className="qzpw-pulse" />
          <div className="qzpw-name">{name}</div>
          <div className="qzpw-hint">Waiting for the host to start…</div>
        </div>
      )}

      {/* ── Question / Answered ── */}
      {(phase === "question" || phase === "answered") && q && (
        <div className="qzp-game">
          <div className="qzpg-hd">
            <span>{qi + 1} / {total}</span>
            <span className="qzpg-score">{score.toLocaleString()} pts</span>
          </div>
          <div className="qzpg-bar" style={{ "--p": `${(timer / QUIZ_TIME) * 100}%` }} />
          <div className="qzpg-q">{q.q}</div>
          <AnswerGrid opts={q.opts} chosen={chosen} disabled={phase === "answered"} onChoose={answer} />
          {phase === "answered" && <div className="qzpg-sub">Answer locked in — waiting for reveal…</div>}
        </div>
      )}

      {/* ── Reveal ── */}
      {phase === "reveal" && q && (
        <div className="qzp-reveal">
          <div className={`qzpr-badge ${lastPts > 0 ? "right" : "wrong"}`}>
            {lastPts > 0 ? "✓ Correct!" : "✗ Incorrect"}
          </div>
          {lastPts > 0 && <div className="qzpr-pts">+{lastPts.toLocaleString()} pts</div>}
          <div className="qzpr-ans">Correct answer: <strong>{q.opts[correct]}</strong></div>
          <div className="qzpr-exp">{q.exp}</div>
          <div className="qzpr-total">{score.toLocaleString()} pts total</div>
          <div className="qzpw-hint">Next question coming…</div>
        </div>
      )}

      {/* ── Finished ── */}
      {phase === "finished" && (
        <div className="qzp-end">
          <div className="qzpe-title">Game over!</div>
          <div className="qzpe-name">{name}</div>
          <div className="qzpe-score">{score.toLocaleString()}</div>
          <div className="qzpe-rank mono">pts{myRank > 0 ? ` · #${myRank} of ${finalBoard.length}` : ""}</div>
          <button className="btn btn-primary" onClick={onExit}>Back to course</button>
        </div>
      )}
    </div>
  );
}

// ── ENTRY SCREEN ──────────────────────────────────────────────
function QuizView({ onExit }) {
  const [mode, setMode] = useState("choose");
  if (mode === "host")   return <QuizHost   onExit={onExit} />;
  if (mode === "player") return <QuizPlayer onExit={onExit} />;
  return (
    <div className="qz-choose">
      <button className="qz-back" onClick={onExit}>← Back to course</button>
      <div className="qzc-hero">
        <div className="qzc-ico">🎯</div>
        <h2 className="qzc-title">Live Quiz</h2>
        <p className="qzc-sub">Test your knowledge across all 6 lectures. Host a room, share the code, and compete in real time — or add bots for a solo run.</p>
      </div>
      <div className="qzc-cards">
        <button className="qzc-card" onClick={() => setMode("host")}>
          <span className="qzcc-ico">📡</span>
          <div className="qzcc-name">Host a quiz</div>
          <div className="qzcc-desc">Create a room, share the code, and control the pace. Add bots for solo demos.</div>
        </button>
        <button className="qzc-card" onClick={() => setMode("player")}>
          <span className="qzcc-ico">🎮</span>
          <div className="qzcc-name">Join a quiz</div>
          <div className="qzcc-desc">Enter a room code from the host and play along on any tab.</div>
        </button>
      </div>
      <p className="qzc-note">Works across tabs in the same browser · cross-device needs a server</p>
    </div>
  );
}

Object.assign(window, { QuizView, TimerRing, AnswerGrid });

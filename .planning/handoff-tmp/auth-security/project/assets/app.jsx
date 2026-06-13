/* Course controller: theme, routing (home ↔ lecture), sidebar, lesson stage, nav */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "author1Name": "Truc Le",
  "author1Role": "Security Engineer",
  "author1Bio": "Passionate about helping developers build safe, robust systems. Has led security initiatives across multiple product teams.",
  "author2Name": "Khanh Do",
  "author2Role": "Full-Stack Developer",
  "author2Bio": "Specialises in authentication systems, web security, and making complex topics feel approachable through interactive demos.",
  "aboutLayout": "cards"
}/*EDITMODE-END*/;

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("authsec-theme") || "dark");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("authsec-theme", theme);
  }, [theme]);
  return [theme, () => setTheme((t) => (t === "dark" ? "light" : "dark"))];
}

const loadProgress = () => { try { return JSON.parse(localStorage.getItem("authsec-progress")) || {}; } catch (e) { return {}; } };

function App() {
  const [theme, toggle] = useTheme();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const init = loadProgress();
  const [view, setView] = useState(init.view || "home"); // home | lecture
  const [li, setLi] = useState(init.li ?? 0);
  const [pi, setPi] = useState(init.pi ?? 0);
  const [completed, setCompleted] = useState(init.completed || []);
  const [dir, setDir] = useState(1);
  const [sideOpen, setSideOpen] = useState(() => window.innerWidth > 980);
  const stageRef = useRef(null);

  // persist
  useEffect(() => {
    localStorage.setItem("authsec-progress", JSON.stringify({ view, li, pi, completed }));
  }, [view, li, pi, completed]);

  const lecture = LECTURES[li];
  const panels = lecture ? lecture.steps.length + 1 : 0; // +cover
  const markDone = (id) => setCompleted((c) => (c.includes(id) ? c : [...c, id]));

  const open   = (idx) => { setLi(idx); setPi(0); setDir(1); setView("lecture"); setSideOpen(false); window.scrollTo(0, 0); };
  const resume  = () => { setView("lecture"); setSideOpen(false); window.scrollTo(0, 0); };
  const home    = () => { setView("home"); window.scrollTo(0, 0); };
  const goQuiz  = () => { setView("quiz"); window.scrollTo(0, 0); };

  const scrollStageTop = () => { if (stageRef.current) stageRef.current.scrollTop = 0; window.scrollTo(0, 0); };

  const next = () => {
    if (pi < panels - 1) { setDir(1); setPi((p) => p + 1); scrollStageTop(); }
    else { // finishing
      markDone(lecture.id);
      if (li < LECTURES.length - 1) open(li + 1);
      else home();
    }
  };
  const prev = () => {
    if (pi > 0) { setDir(-1); setPi((p) => p - 1); scrollStageTop(); }
    else home();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (view !== "lecture") return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="app">
      <TopBar theme={theme} toggle={toggle} view={view} onHome={home}
        lecture={lecture} onMenu={() => setSideOpen((v) => !v)} />

      {view === "home" ? (
        <Home completed={completed} onOpen={open} onResume={resume} lastLi={li} tweaks={t} onQuiz={goQuiz} />
      ) : view === "quiz" ? (
        <QuizView onExit={home} />
      ) : view === "lecture" ? (
        <div className={`course ${sideOpen ? "side-open" : ""}`}>
          <Sidebar lectures={LECTURES} li={li} pi={pi} completed={completed}
            onOpen={open} onClose={() => setSideOpen(false)} onHome={home} />
          <main className="stage" ref={stageRef}>
            <LessonPanel lecture={lecture} pi={pi} dir={dir} />
            <FooterNav lecture={lecture} pi={pi} panels={panels} onPrev={prev} onNext={next} completed={completed.includes(lecture.id)} />
          </main>
        </div>
      ) : null}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Author 1" />
        <TweakText label="Name"  value={t.author1Name} onChange={v => setTweak("author1Name", v)} />
        <TweakText label="Role"  value={t.author1Role} onChange={v => setTweak("author1Role", v)} />
        <TweakText label="Bio"   value={t.author1Bio}  onChange={v => setTweak("author1Bio",  v)} />
        <TweakSection label="Author 2" />
        <TweakText label="Name"  value={t.author2Name} onChange={v => setTweak("author2Name", v)} />
        <TweakText label="Role"  value={t.author2Role} onChange={v => setTweak("author2Role", v)} />
        <TweakText label="Bio"   value={t.author2Bio}  onChange={v => setTweak("author2Bio",  v)} />
        <TweakSection label="About section" />
        <TweakRadio label="Layout" value={t.aboutLayout} options={["cards", "row"]} onChange={v => setTweak("aboutLayout", v)} />
      </TweaksPanel>
    </div>
  );
}

function TopBar({ theme, toggle, view, onHome, lecture, onMenu }) {
  const inLecture = view === "lecture";
  return (
    <nav className="topbar">
      <div className="tb-left">
        {inLecture ? (
          <button className="tb-menu" onClick={onMenu} aria-label="lectures">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </button>
        ) : null}
        {inLecture ? (
          <div className="brand brand-static">
            <span className="mark">{I.shield}</span>
            <span className="brand-txt brand-lecture">{lecture.title}</span>
          </div>
        ) : (
          <button className="brand" onClick={onHome}>
            <span className="mark">{I.shield}</span>
            <span className="brand-txt">Auth &amp; Security <span className="dim">· course</span></span>
          </button>
        )}
      </div>
      <div className="tb-right">
        {inLecture && <span className="tb-crumb mono">Lecture {lecture.n}</span>}
        <button className="theme-toggle" onClick={toggle} aria-label="toggle theme" title="Toggle light / dark">
          {theme === "dark" ? I.sun : I.moon}
        </button>
      </div>
    </nav>
  );
}

function Sidebar({ lectures, li, pi, completed, onOpen, onClose, onHome }) {
  return (
    <React.Fragment>
      <div className="side-scrim" onClick={onClose} />
      <aside className="sidebar">
        <div className="side-title mono">COURSE CONTENTS</div>
        <ol className="side-list">
          {lectures.map((l, i) => {
            const done = completed.includes(l.id);
            const active = i === li;
            return (
              <li key={l.id}>
                <button className={`side-item ${active ? "active" : ""} ${done ? "done" : ""}`} onClick={() => onOpen(i)}>
                  <span className="si-dot">{done ? I.check : <span className="si-n">{l.n}</span>}</span>
                  <span className="si-txt">{l.title}</span>
                </button>
                {active && (
                  <div className="si-steps">
                    {Array.from({ length: l.steps.length + 1 }).map((_, s) => (
                      <span key={s} className={`si-step ${s === pi ? "on" : ""} ${s < pi ? "past" : ""}`} />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <button className="side-home-btn" onClick={onHome}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to home
        </button>
      </aside>
    </React.Fragment>
  );
}

function LessonPanel({ lecture, pi, dir }) {
  const isCover = pi === 0;
  const step = isCover ? null : lecture.steps[pi - 1];
  const key = `${lecture.id}-${pi}`;

  return (
    <div className="panel-shell">
      <div className={`panel ${dir > 0 ? "from-right" : "from-left"}`} key={key}>
        {isCover ? (
          <Cover lecture={lecture} />
        ) : step.kind === "concept" ? (
          <Concept step={step} />
        ) : step.kind === "demo" ? (
          <DemoStep step={step} />
        ) : (
          <RecapStep lecture={lecture} step={step} />
        )}
      </div>
    </div>
  );
}

function Cover({ lecture }) {
  return (
    <div className="cover">
      <div className="cover-badge" style={{ "--lc": lecture.color }}>
        <span className="cover-ico">{lecture.icon}</span>
      </div>
      <div className="cover-n mono">LECTURE {lecture.n} · {lecture.dur}</div>
      <h1 className="cover-title">{lecture.title}</h1>
      <p className="cover-tag">{lecture.tagline}</p>
      <div className="cover-learn">
        <div className="cl-h mono">IN THIS LECTURE</div>
        <ul>
          {lecture.learn.map((t, i) => <li key={i}><span className="cl-tick">{I.check}</span>{t}</li>)}
        </ul>
      </div>
      <div className="cover-hint glue">Press <span className="kbd">Next →</span> to begin</div>
    </div>
  );
}

function Concept({ step }) {
  return (
    <div className="concept">
      {step.eyebrow && <div className="eyebrow">{step.eyebrow}</div>}
      <h2 className="concept-title">{step.title}</h2>
      <div className="concept-body">{step.body}</div>
    </div>
  );
}

function DemoStep({ step }) {
  const Demo = window[step.demo];
  return (
    <div className="demostep">
      <div className="demostep-h">
        <div className="eyebrow demo-eyebrow">{I.play} Try it</div>
        <h2 className="concept-title">{step.title}</h2>
        <p className="demostep-cap glue">{step.caption}</p>
      </div>
      <div className="demostep-stage">{Demo ? <Demo /> : <div className="glue">…</div>}</div>
    </div>
  );
}

function RecapStep({ lecture, step }) {
  const last = LECTURES[LECTURES.length - 1].id === lecture.id;
  return (
    <div className="recap">
      <div className="eyebrow">{I.checkCircle} Recap</div>
      <h2 className="concept-title">Key takeaways</h2>
      <ul className="recap-list">
        {step.points.map((p, i) => (
          <li key={i} style={{ animationDelay: `${i * 90}ms` }}><span className="rl-tick">{I.check}</span><span>{p}</span></li>
        ))}
      </ul>
      <div className="recap-foot glue">{last ? "Finish to return to the syllabus." : "Next up: the following lecture."}</div>
    </div>
  );
}

function FooterNav({ lecture, pi, panels, onPrev, onNext, completed }) {
  const last = pi === panels - 1;
  const lastLecture = LECTURES[LECTURES.length - 1].id === lecture.id;
  return (
    <div className="footernav">
      <button className="btn btn-ghost" onClick={onPrev}>{pi === 0 ? "Syllabus" : "Back"}</button>
      <div className="fn-dots">
        {Array.from({ length: panels }).map((_, i) => (
          <span key={i} className={`fn-dot ${i === pi ? "on" : ""} ${i < pi ? "past" : ""}`} />
        ))}
      </div>
      <button className="btn btn-primary" onClick={onNext}>
        {last ? (lastLecture ? <React.Fragment>Finish course {I.checkCircle}</React.Fragment> : <React.Fragment>Complete &amp; continue {I.arrow}</React.Fragment>)
              : <React.Fragment>Next {I.arrow}</React.Fragment>}
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
Object.assign(window, { App });

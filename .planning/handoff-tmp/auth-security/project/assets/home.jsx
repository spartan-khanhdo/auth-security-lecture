/* Course home — syllabus + progress */
function Home({ completed, onOpen, onResume, lastLi, tweaks, onQuiz }) {
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => { const t = setTimeout(() => setUnlocked(true), 700); return () => clearTimeout(t); }, []);
  const doneCount = LECTURES.filter((l) => completed.includes(l.id)).length;
  const pct = Math.round((doneCount / LECTURES.length) * 100);
  const started = doneCount > 0 || lastLi > 0;

  const initials = (name) => (name || "??").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="home">
      <div className="wrap">
        <section className="home-hero">
          <div className="home-hero-copy">
            <div className="hero-eyebrow"><span className="dotpulse" /> An interactive course · 5 lectures</div>
            <h1 className="hero-title">Authentication<br/><span className="amp">&amp;</span> <span className="grad">Security</span></h1>
            <p className="hero-lede">How apps know <em>who you are</em> — and decide <em>what you're allowed to do</em>. Six short lectures, each ending in a demo you can actually poke at.</p>
            <div className="home-cta">
              <button className="btn btn-primary" onClick={() => started ? onResume() : onOpen(0)}>
                {I.play} {started ? "Resume course" : "Start the course"}
              </button>
              <div className="home-prog">
                <div className="home-prog-bar"><span style={{ width: pct + "%" }} /></div>
                <span className="mono">{doneCount}/{LECTURES.length} complete</span>
              </div>
            </div>
            <div className="hero-authors">
              <div className="hero-author">
                <span className="author-ava" style={{ background: "var(--primary)" }}>{initials(tweaks.author1Name)}</span>
                <span className="author-name">{tweaks.author1Name}</span>
              </div>
              <span className="author-sep">·</span>
              <div className="hero-author">
                <span className="author-ava" style={{ background: "var(--pink)" }}>{initials(tweaks.author2Name)}</span>
                <span className="author-name">{tweaks.author2Name}</span>
              </div>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="orbit">
              <div className={`lockcore ${unlocked ? "open" : ""}`} onClick={() => setUnlocked((v) => !v)}>
                <div className="lock-ico">{unlocked ? I.unlock : I.lock}</div>
                <div className="lock-ring" /><div className="lock-ring r2" />
              </div>
              <div className="floatpill p1"><Pill kind="person" person="Kim">Kim</Pill></div>
              <div className="floatpill p2"><Pill kind="role" icon={I.key}>owner</Pill></div>
              <div className="floatpill p3"><Pill kind="object" icon={I.doc}>doc:roadmap</Pill></div>
              <div className="floatpill p4"><Pill kind="role" icon={I.eye}>viewer</Pill></div>
            </div>
          </div>
        </section>

        <section className="about-section">
          <div className="syllabus-h">
            <h2>About the authors</h2>
            <p className="glue">The people behind this course.</p>
          </div>
          <div className={`about-authors ${tweaks.aboutLayout === "row" ? "about-row" : "about-cards"}`}>
            <div className="about-card">
              <span className="about-ava" style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-2))" }}>{initials(tweaks.author1Name)}</span>
              <div className="about-info">
                <div className="about-name">{tweaks.author1Name}</div>
                <div className="about-role mono">{tweaks.author1Role}</div>
                <p className="about-bio">{tweaks.author1Bio}</p>
              </div>
            </div>
            <div className="about-card">
              <span className="about-ava" style={{ background: "linear-gradient(135deg, var(--pink), var(--pill-role))" }}>{initials(tweaks.author2Name)}</span>
              <div className="about-info">
                <div className="about-name">{tweaks.author2Name}</div>
                <div className="about-role mono">{tweaks.author2Role}</div>
                <p className="about-bio">{tweaks.author2Bio}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="syllabus">
          <div className="syllabus-h">
            <h2>The syllabus</h2>
            <p className="glue">Take them in order, or jump to whatever you're curious about.</p>
          </div>
          <div className="lec-cards">
            {LECTURES.map((l, i) => {
              const done = completed.includes(l.id);
              return (
                <button className={`lec-card ${done ? "done" : ""}`} key={l.id} onClick={() => onOpen(i)} style={{ "--lc": l.color }}>
                  <div className="lc-top">
                    <span className="lc-n mono">{l.n}</span>
                    <span className="lc-ico">{l.icon}</span>
                    {done && <span className="lc-check">{I.check}</span>}
                  </div>
                  <h3>{l.title}</h3>
                  <p>{l.tagline}</p>
                  <div className="lc-foot">
                    <span className="lc-dur">{l.dur}</span>
                    <span className="lc-go">{done ? "Review" : "Start"} {I.arrow}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="home-quiz-row">
            <button className="quiz-entry-btn" onClick={onQuiz}>
              <span className="qeb-ico">🎯</span>
              <div className="qeb-text">
                <strong>Live Quiz</strong>
                <span>Test your knowledge across all 6 lectures — host a room or join one</span>
              </div>
              <span className="qeb-arrow">{I.arrow}</span>
            </button>
          </div>
        </section>

        <footer className="home-foot glue">
          <span>A friendly field guide to authentication &amp; security.</span>
          <span className="mono">{pct}% complete</span>
        </footer>
      </div>
    </div>
  );
}
Object.assign(window, { Home });

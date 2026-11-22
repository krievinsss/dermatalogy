import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Brain, Check, CheckCircle2,
  ChevronDown, ChevronRight, CircleAlert, Clock3, Flame, Lightbulb,
  RotateCcw, ShieldCheck, Sparkles, Target, Trophy, X,
} from 'lucide-react';
import {
  createSession, questionMap, questions, QUIZ_SIZE, readStorage, removeStorage,
  STORAGE, topics, TOTAL, validSession, writeStorage,
  type HistoryEntry, type QuizMode, type QuizSession,
} from './lib/quiz';

function useLocalState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStorage(key, fallback));
  useEffect(() => writeStorage(key, value), [key, value]);
  return [value, setValue] as const;
}

function Logo() {
  return (
    <div className="brand" aria-label="DermaLab">
      <div className="brand-mark"><span>✳</span></div>
      <span>derma<span className="brand-dot">.</span>lab</span>
    </div>
  );
}

function ProgressDots({ total, current }: { total: number; current: number }) {
  return <div className="progress-rail" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current}>
    <span className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, current / total * 100))}%` }} />
  </div>;
}

function ResultGauge({ score, total }: { score: number; total: number }) {
  const percent = Math.round(score / total * 100);
  return <div className="result-gauge" style={{ '--score': `${percent}%` } as React.CSSProperties}>
    <div className="result-gauge-inner"><strong>{score}<span> / {total}</span></strong><small>PAREIZAS</small></div>
  </div>;
}

export default function App() {
  const [session, setSession] = useState<QuizSession | null>(() => {
    const loaded = readStorage<QuizSession | null>(STORAGE.session, null);
    return validSession(loaded) ? loaded : null;
  });
  const [history, setHistory] = useLocalState<HistoryEntry[]>(STORAGE.history, []);
  const [mistakes, setMistakes] = useLocalState<Record<string, number>>(STORAGE.mistakes, {});
  const [showResults, setShowResults] = useState(false);
  const [showQuit, setShowQuit] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const [showTheoryForCorrect, setShowTheoryForCorrect] = useState(false);
  const theoryRef = useRef<HTMLElement | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session) writeStorage(STORAGE.session, session);
    else removeStorage(STORAGE.session);
  }, [session]);

  const mistakeIds = useMemo(() => Object.keys(mistakes).filter(id => questionMap.has(id)), [mistakes]);
  const answered = session?.answers ?? [];
  const currentItem = session?.items[session.step];
  const currentQuestion = currentItem ? questionMap.get(currentItem.id) : undefined;
  const currentAnswer = session?.revealed ? answered[answered.length - 1] : undefined;
  const score = answered.filter(a => a.correct).length;
  const answeredWrong = answered.filter(a => !a.correct);
  const latest = history[0];
  const totalPracticed = history.reduce((sum, item) => sum + item.total, 0);
  const totalCorrect = history.reduce((sum, item) => sum + item.score, 0);
  const accuracy = totalPracticed ? Math.round(totalCorrect / totalPracticed * 100) : null;

  function start(mode: QuizMode) {
    if (mode === 'mistakes' && mistakeIds.length === 0) return;
    setSession(createSession(mode, mistakeIds));
    setShowResults(false);
    setShowQuit(false);
    setShowTheoryForCorrect(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function submitAnswer() {
    if (!session || !currentQuestion || !currentItem || session.selectedVisibleIndex === null || session.revealed) return;
    const selectedOriginalIndex = currentItem.order[session.selectedVisibleIndex];
    const correct = selectedOriginalIndex === currentQuestion.correctIndex;
    const record = { id: currentQuestion.id, selectedOriginalIndex, correct };
    setSession(prev => prev ? { ...prev, revealed: true, answers: [...prev.answers, record] } : null);
    setMistakes(prev => {
      const next = { ...prev };
      if (correct) delete next[currentQuestion.id];
      else next[currentQuestion.id] = (next[currentQuestion.id] || 0) + 1;
      return next;
    });
    setShowTheoryForCorrect(false);
    if (!correct) {
      requestAnimationFrame(() => {
        setTimeout(() => theoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 90);
      });
    }
  }

  function nextQuestion() {
    if (!session || !session.revealed) return;
    if (session.step === QUIZ_SIZE - 1) {
      const entry: HistoryEntry = {
        id: `r-${Date.now()}`, date: Date.now(), score, total: QUIZ_SIZE,
        mode: session.mode, wrongIds: answered.filter(a => !a.correct).map(a => a.id),
      };
      setHistory(prev => [entry, ...prev].slice(0, 30));
      setSession(null);
      setShowResults(true);
    } else {
      setSession(prev => prev ? { ...prev, step: prev.step + 1, selectedVisibleIndex: null, revealed: false } : null);
      setShowTheoryForCorrect(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function quit() {
    setSession(null);
    setShowResults(false);
    setShowQuit(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const isResultPage = showResults && !session && !!latest;
  const isHomePage = !session && !isResultPage;

  return <div className="app" ref={topRef}>
    <header className="site-header">
      <div className="shell header-inner">
        <Logo />
        {session ? (
          <button className="header-action" onClick={() => setShowQuit(true)} aria-label="Pārtraukt testu"><X size={18} /> <span>Pārtraukt</span></button>
        ) : isResultPage ? (
          <button className="header-action" onClick={() => setShowResults(false)}><ArrowLeft size={17} /> <span>Sākums</span></button>
        ) : <div className="header-pill"><span className="status-dot" /> Tavs mācību trenažieris</div>}
      </div>
    </header>

    {isHomePage && <main className="shell home-page">
      <div className="intro-grid">
        <section className="hero">
          <div className="eyebrow"><span className="eyebrow-line" /> KLINĪSKĀS ZINĀŠANAS PRAKSĒ</div>
          <h1>Ne tikai iegaumē.<br/><span>Izproti.</span></h1>
          <p className="hero-copy">Īsi testi, rūpīgi veidoti jautājumi un skaidrojumi, kas palīdz saprast <strong>kāpēc</strong> atbilde ir pareiza.</p>
          <div className="home-buttons">
            <button className="primary-button" onClick={() => start('balanced')}>
              <span><Sparkles size={19} strokeWidth={2.1} /> Sākt 15 jautājumu testu</span><ArrowUpRight size={20} />
            </button>
            <div className="button-caption">15 nejauši jautājumi · pa vienam no katras tēmas</div>
          </div>
        </section>
        <aside className="hero-art" aria-label="Dermatoloģijas apmācības vizuālais noformējums">
          <div className="art-top"><span>DERMA / 01</span><span>LEARN BY DOING</span></div>
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-orbit orbit-three" />
          <div className="art-center"><div className="art-center-inner"><Brain size={42} strokeWidth={1.3}/></div></div>
          <div className="art-sticker"><span>15</span><small>tēmas katrā testā</small></div>
          <div className="art-bottom"><span>SKIN SCIENCE</span><span>225 PRACTICE QUESTIONS</span></div>
        </aside>
      </div>

      <section className="stats-grid" aria-label="Mācību rādītāji">
        <div className="stat-card"><div className="stat-icon green"><BookOpen size={20}/></div><strong>{TOTAL}</strong><span>jautājumi bankā</span></div>
        <div className="stat-card"><div className="stat-icon lavender"><Target size={20}/></div><strong>{topics.length}</strong><span>aptvertās tēmas</span></div>
        <div className="stat-card"><div className="stat-icon orange"><Flame size={20}/></div><strong>{accuracy === null ? '—' : `${accuracy}%`}</strong><span>tava precizitāte</span></div>
      </section>

      <section className="below-grid">
        <div className="panel secondary-panel">
          <div className="panel-heading"><div><span className="kicker">NĀKAMAIS SOLIS</span><h2>Trenē vājās vietas</h2></div><div className="small-icon"><RotateCcw size={19}/></div></div>
          <p>Ja kādā jautājumā kļūdīsies, mēs to paturēsim atkārtošanai. Pārbaudi tieši tās tēmas, kuras vēl jānostiprina.</p>
          <button className="secondary-button" onClick={() => start('mistakes')} disabled={mistakeIds.length === 0}>
            <span>Atkārtot kļūdainos jautājumus</span><span className="button-tail">{mistakeIds.length} <ArrowRight size={17}/></span>
          </button>
          <div className="panel-footnote"><ShieldCheck size={14} /> Progress tiek glabāts tikai šajā pārlūkā.</div>
        </div>
        <div className="panel history-panel">
          <div className="panel-heading"><div><span className="kicker">TAVS PROGRESS</span><h2>Pēdējie testi</h2></div><div className="small-icon"><Clock3 size={19}/></div></div>
          {history.length === 0 ? <div className="empty-history"><div className="empty-history-icon"><Trophy size={23}/></div><strong>Sāc ar pirmo testu</strong><span>Te vēlāk redzēsi savu progresu.</span></div> :
            <div className="history-list">{history.slice(0, 3).map((h, i) => <div className="history-row" key={h.id}>
              <span className="history-circle">{i + 1}</span><div className="history-row-center"><strong>{h.mode === 'balanced' ? 'Pilnais tests' : 'Kļūdu treniņš'}</strong><span>{new Date(h.date).toLocaleDateString('lv-LV', { day: 'numeric', month: 'short' })}</span></div><b>{h.score}/{h.total}</b>
            </div>)}</div>}
        </div>
      </section>

      <section className="topics-section">
        <button type="button" className="topics-toggle" onClick={() => setShowTopics(v => !v)} aria-expanded={showTopics}>
          <div><span className="kicker">KO TU APGŪSI</span><h2>Visas 15 tēmas <span className="subtle-number">/ 15</span></h2></div><div className="toggle-icon"><ChevronDown size={22} className={showTopics ? 'rotated' : ''}/></div>
        </button>
        {showTopics && <div className="topic-grid">{topics.map((t, index) => <div className="topic-row" key={t.id}><span>{String(index + 1).padStart(2,'0')}</span><strong>{t.name}</strong><small>15 jaut.</small></div>)}</div>}
      </section>
    </main>}

    {session && currentItem && currentQuestion && <main className="shell quiz-page">
      <div className="quiz-layout">
        <div className="quiz-topline"><span className="session-kicker"><span className="session-bullet" /> {session.mode === 'balanced' ? 'PILNAIS TESTS' : 'KĻŪDU TRENIŅŠ'}</span><strong>{String(session.step + 1).padStart(2,'0')} <span>/ {QUIZ_SIZE}</span></strong></div>
        <ProgressDots total={QUIZ_SIZE} current={session.step + (session.revealed ? 1 : 0)} />
        <section className="question-card" aria-label="Testa jautājums">
          <div className="question-top"><span className="topic-tag"><span className="topic-tag-dot" /> {currentQuestion.topic}</span><span className="difficulty"><span className="difficulty-bars"><i/><i/><i className={currentQuestion.difficulty === 3 ? '' : 'inactive'}/></span> {currentQuestion.difficulty === 3 ? 'Sarežģīts' : 'Vidējs'}</span></div>
          <h2>{currentQuestion.question}</h2>
          <div className="answers" role="group" aria-label="Atbilžu varianti">
            {currentItem.order.map((originalIndex, visibleIndex) => {
              const selected = session.selectedVisibleIndex === visibleIndex;
              const isCorrect = originalIndex === currentQuestion.correctIndex;
              const reveal = session.revealed;
              const showCorrect = reveal && isCorrect;
              const showWrong = reveal && selected && !isCorrect;
              return <button type="button" key={`${currentQuestion.id}-${originalIndex}`} disabled={reveal}
                onClick={() => setSession(prev => prev ? { ...prev, selectedVisibleIndex: visibleIndex } : null)}
                className={`answer-option ${selected ? 'selected' : ''} ${showCorrect ? 'correct' : ''} ${showWrong ? 'incorrect' : ''}`} aria-pressed={selected}>
                <span className="letter">{String.fromCharCode(65 + visibleIndex)}</span>
                <span className="answer-label">{currentQuestion.options[originalIndex]}</span>
                {showCorrect ? <CheckCircle2 className="answer-status" size={20}/> : showWrong ? <X className="answer-status" size={20}/> : selected ? <span className="select-indicator" /> : null}
              </button>;
            })}
          </div>
          {!session.revealed && <div className="question-actions"><button className="submit-button" disabled={session.selectedVisibleIndex === null} onClick={submitAnswer}><span>Pārbaudīt atbildi</span><ArrowRight size={19}/></button><span>Izvēlies vienu pareizo variantu</span></div>}
        </section>

        {session.revealed && currentAnswer && <section className={`feedback-card ${currentAnswer.correct ? 'feedback-correct' : 'feedback-wrong'}`} ref={theoryRef} aria-live="polite">
          <div className="feedback-header">
            <div className="feedback-symbol">{currentAnswer.correct ? <Check size={21}/> : <CircleAlert size={21}/>}</div>
            <div><span className="feedback-eyebrow">{currentAnswer.correct ? 'IZCILI!' : 'TE IR VIETA IZAUGSMEI'}</span><h3>{currentAnswer.correct ? 'Pareiza atbilde!' : 'Šoreiz nepareizi. Izproti, nevis mini.'}</h3></div>
          </div>
          {!currentAnswer.correct && <div className="correct-answer-box"><small>PAREIZĀ ATBILDE</small><strong>{currentQuestion.options[currentQuestion.correctIndex]}</strong></div>}
          {currentAnswer.correct && !showTheoryForCorrect ? <button className="reveal-theory" onClick={() => setShowTheoryForCorrect(true)}><BookOpen size={17}/> Izlasīt skaidrojumu <ChevronRight size={16}/></button> :
            <div className="lesson-block"><div className="lesson-heading"><BookOpen size={18}/><strong>Teorija, kas palīdz saprast</strong></div><p>{currentQuestion.theory}</p><div className="takeaway"><Lightbulb size={18}/><div><small>ATCERIES</small><strong>{currentQuestion.takeaway}</strong></div></div><div className="lesson-source">Pamats: {currentQuestion.source}</div></div>}
          <button className="next-button" onClick={nextQuestion}>
            <span>{session.step === QUIZ_SIZE - 1 ? 'Skatīt rezultātus' : 'Nākamais jautājums'}</span><ArrowRight size={19}/>
          </button>
        </section>}
        <div className="quiz-bottom">Jautājumi tiek atlasīti nejauši no {TOTAL} jautājumu bankas.</div>
      </div>
    </main>}

    {isResultPage && latest && <main className="shell result-page">
      <div className="result-card">
        <div className="result-top"><span className="eyebrow"><span className="eyebrow-line"/> TESTS PABEIGTS</span><Trophy size={24}/></div>
        <div className="results-flex"><div><h1>{latest.score >= 13 ? 'Lielisks darbs!' : latest.score >= 9 ? 'Labs progress!' : 'Katrs tests māca.'}</h1><p>{latest.score >= 13 ? 'Tu lieliski pārzini šīs tēmas. Turpini trenēt nianses!' : 'Svarīgākais ir saprast kļūdas. Nākamajā reizē būs arvien labāk.'}</p><div className="result-buttons"><button className="primary-button" onClick={() => start('balanced')}><span><RotateCcw size={18}/> Jauns tests</span><ArrowUpRight size={19}/></button><button className="result-secondary" onClick={() => setShowResults(false)}>Atgriezties sākumā</button></div></div><ResultGauge score={latest.score} total={latest.total}/></div>
      </div>
      <section className="result-review"><div className="review-heading"><div><span className="kicker">ATKĀRTOŠANAI</span><h2>{latest.wrongIds.length === 0 ? 'Nevienas kļūdas!' : `Tavas ${latest.wrongIds.length} kļūdas`}</h2></div><span className="review-count">{latest.wrongIds.length} / {QUIZ_SIZE}</span></div>
        {latest.wrongIds.length === 0 ? <div className="perfect-review"><CheckCircle2 size={24}/><span>Visas 15 atbildes pareizas. Gatavs jaunam izaicinājumam!</span></div> :
          <div className="review-list">{latest.wrongIds.map(id => {const q = questionMap.get(id); return q ? <details className="review-item" key={id}><summary><span className="review-dot"><BookOpen size={17}/></span><div><small>{q.topic}</small><strong>{q.question}</strong></div><ChevronDown size={18}/></summary><div className="review-details"><div className="review-correct">Pareizā atbilde: <strong>{q.options[q.correctIndex]}</strong></div><p>{q.theory}</p><div className="review-memory"><Lightbulb size={16}/><span>{q.takeaway}</span></div></div></details> : null;})}</div>}
        {mistakeIds.length > 0 && <button className="secondary-button result-mistakes" onClick={() => start('mistakes')}><span>Vingrināt kļūdu jautājumus</span><span className="button-tail">{mistakeIds.length} <ArrowRight size={18}/></span></button>}
      </section>
    </main>}

    <footer className="site-footer"><div className="shell footer-inner"><span>derma<span className="brand-dot">.</span>lab <span>© 2026</span></span><p>Mācību materiāls, nevis klīniskas ārstēšanas vadlīnijas.</p></div></footer>

    {showQuit && <div className="modal-backdrop" role="presentation" onClick={() => setShowQuit(false)}><div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="quit-title" onClick={e => e.stopPropagation()}><div className="modal-icon"><CircleAlert size={24}/></div><h2 id="quit-title">Pārtraukt testu?</h2><p>Pašreizējās sesijas atbildes netiks pieskaitītas pabeigtajiem testiem.</p><div className="modal-actions"><button onClick={() => setShowQuit(false)}>Turpināt mācīties</button><button onClick={quit}>Pārtraukt</button></div></div></div>}
  </div>;
}

'use client';

import { useEffect, useRef, useState } from 'react';

type Question = { question: string; options: string[]; correct: number; category: string };
type Result = Question & { error?: string; code?: string; limited?: boolean };

const ROUND = 10;
const BEST_KEY = 'trivia:best';
const LETTERS = ['A', 'B', 'C', 'D'];

async function fetchQuestion(): Promise<Result> {
  const res = await fetch('/api/question');
  const data: Result = await res.json().catch(() => ({ error: 'Something went wrong' }) as Result);
  // Each question is one API call, and the free plan allows 5 a minute, so a fast round can outrun it.
  if (res.status === 429) return { ...data, limited: true, error: 'Quick fingers! Your next question loads by itself in a few seconds.' };
  return data;
}

export default function Quiz() {
  const [q, setQ] = useState<Question | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [number, setNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [missingKey, setMissingKey] = useState(false);
  // The next question is fetched while you read this one, so Next is instant.
  const next = useRef<Promise<Result> | null>(null);
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      setBest(Number(localStorage.getItem(BEST_KEY)) || 0);
    } catch {}
    load();
    return () => {
      if (retry.current) clearTimeout(retry.current);
    };
  }, []);

  async function load() {
    if (retry.current) clearTimeout(retry.current);
    setLoading(true);
    setError('');
    const data = await (next.current || fetchQuestion());
    next.current = null;
    setLoading(false);
    if (data.code === 'missing_key') return setMissingKey(true);
    if (data.limited) retry.current = setTimeout(load, 15_000);
    if (data.error) return setError(data.error);
    setQ(data);
    setPicked(null);
  }

  function answer(i: number) {
    if (!q || picked !== null) return;
    setPicked(i);
    const right = i === q.correct;
    setScore((s) => s + (right ? 1 : 0));
    setStreak((s) => (right ? s + 1 : 0));
    if (number < ROUND) next.current = fetchQuestion();
  }

  function advance() {
    if (number >= ROUND) {
      setDone(true);
      if (score > best) {
        setBest(score);
        try {
          localStorage.setItem(BEST_KEY, String(score));
        } catch {}
      }
      return;
    }
    setNumber((n) => n + 1);
    load();
  }

  function restart() {
    setNumber(1);
    setScore(0);
    setStreak(0);
    setDone(false);
    load();
  }

  if (missingKey) {
    return (
      <main className="stage">
        <section className="card setup">
          <p className="pill">One step left</p>
          <h1>Add your API key</h1>
          <p>
            Questions come from the APIVerve Trivia Generator API. Create a free key at{' '}
            <a href="https://dashboard.apiverve.com/signup?api=trivia&utm_source=template&utm_medium=app&utm_campaign=trivia-quiz-nextjs-tutorial">dashboard.apiverve.com</a>, set{' '}
            <code>APIVERVE_API_KEY</code> in <code>.env</code> or in your Vercel project, and reload.
          </p>
        </section>
      </main>
    );
  }

  const verdict = score >= 8 ? 'Trivia royalty.' : score >= 5 ? 'Solid round!' : 'Every expert started somewhere.';

  return (
    <main className="stage">
      <div className="wrap">
        <header className="top">
          <span className="logo">Quiz<b>Night</b></span>
          <div className="stats">
            <span>⭐ {score}</span>
            <span>🔥 {streak}</span>
            <span>🏆 {best}</span>
          </div>
        </header>

        {done ? (
          <section className="card finish">
            <p className="pill">Round complete</p>
            <p className="big">
              {score}
              <small>/{ROUND}</small>
            </p>
            <p className="verdict">{verdict}</p>
            {score >= best && score > 0 && <p className="record">New best round!</p>}
            <button className="primary" onClick={restart}>Play again</button>
          </section>
        ) : (
          <section className="card" aria-live="polite">
            <div className="progress" aria-label={`Question ${number} of ${ROUND}`}>
              {Array.from({ length: ROUND }, (_, i) => (
                <i key={i} className={i < number - 1 ? 'past' : i === number - 1 ? 'now' : ''} />
              ))}
            </div>
            <p className="pill">
              Question {number} of {ROUND}
              {q && ` · ${q.category}`}
            </p>
            {error && <p className="error">{error}</p>}
            {q && !error && (
              <>
                <h1 className="question">{q.question}</h1>
                <ul className="options">
                  {q.options.map((o, i) => {
                    const state = picked === null ? '' : i === q.correct ? 'right' : i === picked ? 'wrong' : 'dim';
                    return (
                      <li key={i}>
                        <button className={state} onClick={() => answer(i)} disabled={picked !== null}>
                          <span className="letter">{LETTERS[i]}</span>
                          <span>{o}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            {!q && !error && <p className="question">Shuffling the cards…</p>}
            <div className="foot-row">
              {picked !== null && q && <p className="feedback">{picked === q.correct ? 'Correct!' : `It was ${LETTERS[q.correct] || ''}: ${q.options[q.correct] || ''}`}</p>}
              {(picked !== null || error) && (
                <button className="primary" onClick={error ? load : advance} disabled={loading}>
                  {error ? 'Try again' : number >= ROUND ? 'See score' : 'Next question'}
                </button>
              )}
            </div>
          </section>
        )}

        <p className="credit">
          Questions from the <a href="https://apiverve.com/marketplace/trivia?utm_source=template&utm_medium=app&utm_campaign=trivia-quiz-nextjs-tutorial">APIVerve Trivia Generator API</a>
        </p>
      </div>
    </main>
  );
}

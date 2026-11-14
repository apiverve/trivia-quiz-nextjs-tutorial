import { callApi, guard, respond } from '@/lib/apiverve';

// Every question is new, so nothing is cached here; the guard's per-visitor rate limit still applies.
// The API labels its options "A Company", "B Battalion"...; the route strips those letters
// and returns the index of the right answer, so the page can draw its own buttons.

type Raw = { question: string; answer: string; options: string[]; category: string };
export type Question = { question: string; options: string[]; correct: number; category: string };

const unlabel = (option: string) => option.replace(/^[A-D]\s+/, '');

/** GET /api/question: one multiple-choice question from Trivia Generator. */
export async function GET(request: Request) {
  const blocked = guard(request);
  if (blocked) return blocked;

  return respond(async () => {
    const raw = await callApi<Raw>('trivia');
    const options = raw.options.map(unlabel);
    const answer = raw.answer.trim().toLowerCase();
    let correct = options.findIndex((o) => o.trim().toLowerCase() === answer);
    if (correct < 0) correct = options.findIndex((o) => o.toLowerCase().includes(answer));
    const question: Question = { question: raw.question, options, correct, category: raw.category };
    return question;
  });
}

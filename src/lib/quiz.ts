import raw from '../data/questions.json';

export type TopicId = `T${string}`;
export type Question = {
  id: string;
  topicId: TopicId;
  topic: string;
  source: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  theory: string;
  takeaway: string;
  difficulty: 2 | 3;
};
export type QuizMode = 'balanced' | 'mistakes';
export type QuizItem = { id: string; order: number[] };
export type AnswerRecord = { id: string; selectedOriginalIndex: number; correct: boolean };
export type QuizSession = {
  version: 1;
  mode: QuizMode;
  items: QuizItem[];
  step: number;
  selectedVisibleIndex: number | null;
  revealed: boolean;
  answers: AnswerRecord[];
  startedAt: number;
};
export type HistoryEntry = { id: string; date: number; score: number; total: number; mode: QuizMode; wrongIds: string[] };

export const questions: Question[] = raw as Question[];
export const questionMap = new Map(questions.map(q => [q.id, q]));
export const topics = Array.from(new Map(questions.map(q => [q.topicId, q.topic])).entries()).map(([id, name]) => ({ id, name }));
export const TOTAL = questions.length;
export const QUIZ_SIZE = 15;

export function shuffled<T>(source: T[]): T[] {
  const result = [...source];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createSession(mode: QuizMode, mistakeIds: string[]): QuizSession {
  const chosen: Question[] = [];
  if (mode === 'balanced') {
    // One randomly selected question from each of all 15 topics.
    for (const topic of topics) {
      const pool = questions.filter(q => q.topicId === topic.id);
      chosen.push(shuffled(pool)[0]);
    }
  } else {
    // Prioritize previously missed questions; fill to 15 with unseen / other topics.
    const weak = shuffled(questions.filter(q => mistakeIds.includes(q.id)));
    chosen.push(...weak.slice(0, QUIZ_SIZE));
    const already = new Set(chosen.map(q => q.id));
    const remainingByTopic = shuffled(topics).flatMap(t => {
      return shuffled(questions.filter(q => q.topicId === t.id && !already.has(q.id))).slice(0, 1);
    });
    for (const q of [...remainingByTopic, ...shuffled(questions)]) {
      if (chosen.length >= QUIZ_SIZE) break;
      if (!already.has(q.id)) {
        chosen.push(q);
        already.add(q.id);
      }
    }
  }
  return {
    version: 1,
    mode,
    items: shuffled(chosen).map(q => ({ id: q.id, order: shuffled([0, 1, 2, 3]) })),
    step: 0,
    selectedVisibleIndex: null,
    revealed: false,
    answers: [],
    startedAt: Date.now(),
  };
}

export const STORAGE = {
  session: 'dermalab/session/v1',
  mistakes: 'dermalab/mistakes/v1',
  history: 'dermalab/history/v1',
};

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch { return fallback; }
}
export function writeStorage(key: string, value: unknown): void {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private mode may disable storage. */ }
}
export function removeStorage(key: string): void {
  try { window.localStorage.removeItem(key); } catch { /* Ignore. */ }
}

export function validSession(session: QuizSession | null): session is QuizSession {
  if (!session || session.version !== 1 || !Array.isArray(session.items)) return false;
  if (session.items.length !== QUIZ_SIZE || session.step < 0 || session.step >= QUIZ_SIZE) return false;
  return session.items.every(item => questionMap.has(item.id) && item.order.length === 4 && new Set(item.order).size === 4);
}

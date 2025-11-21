
export interface Verb {
  base: string;
  past: string;
  participle: string;
  category: VerbCategory;
}

export enum VerbCategory {
  N_ENDING = 'Participle ends in -n',
  ABB = 'A-B-B (Past & Participle same)',
  AAA = 'A-A-A (All forms same)',
  IAU = 'i - a - u Pattern',
  ABA = 'A-B-A (Base & Participle same)',
  MODAL = 'Modal Verbs',
}

export type GameMode = 'HOME' | 'STUDY' | 'FLASHCARDS' | 'QUIZ' | 'TIME_ATTACK' | 'MATCH' | 'QUEST';

export interface QuizState {
  currentVerb: Verb | null;
  score: number;
  streak: number;
  showAnswer: boolean;
  userAnswerPast: string;
  userAnswerParticiple: string;
  feedback: 'idle' | 'correct' | 'incorrect';
}

export interface RawQuizData {
  q: string;
  a: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface QuizCategory {
  title: string;
  questions: RawQuizData[];
}

export interface QuizData {
  chapterNumber: string;
  title: string;
  description: string;
  categories: QuizCategory[];
}

export interface QuestionStats {
  correct: number;
  incorrect: number;
  masteryLevel?: number;
}

export interface CategoryHistory {
  bestScore: number;
  lastPlayed: string;
  questionStats: { [questionText: string]: QuestionStats };
}

export interface QuizHistory {
  [categoryTitle: string]: CategoryHistory;
}
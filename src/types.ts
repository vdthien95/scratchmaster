export type Grade = 4 | 5;

export interface Topic {
  id: string;
  title: string;
  grade: Grade;
  description: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface TheoryContent {
  summary: string[];
  example: string;
  quizzes: QuizQuestion[];
}

export interface PracticeExercise {
  id: string;
  title: string;
  level: 'Dễ' | 'Vừa' | 'Khó';
  task: string;
  goal: string;
  hints: string[];
  guidingQuestion: string;
}

export interface ChallengeCriterion {
  label: string;
  maxPoints: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  criteria: ChallengeCriterion[];
}

export interface GradingResult {
  scores: {
    criterion: string;
    score: number;
    maxScore: number;
    reason: string;
  }[];
  totalScore: number;
  generalComment: string;
  suggestions: string;
  encouragement: string;
}

export interface AIResponse {
  comment: string;
  correctPoints: string;
  suggestion: string;
  thoughtQuestion: string;
  encouragement: string;
}

export interface ProblemAnalysis {
  requirements: string;
  steps: string[];
  commandGroups: string[];
  guidingQuestions: string[];
}

export interface ProblemFeedback {
  comment: string;
  suggestions: string;
  encouragement: string;
}

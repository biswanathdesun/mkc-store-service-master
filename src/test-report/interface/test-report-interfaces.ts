import { DifficultyLevelType } from 'src/utills/enum';

export interface AttemptCountInterface {
  value: number;
  label: string;
}

export interface AnswerKeyInterface {
  _id: string;
  question: string;
  answer: string;
  correctAnswer: string;
  spendTime: string;
  difficultyLevels: DifficultyLevelType[];
  marks: number;
  isCorrect: boolean;
}

export interface TimeTakenInterface {
  totalMinutes: number;
  totalSeconds: number;
}

export interface QuestionInterface {
  _id: string;
  question: string;
  a: string;
  b: string;
  c: string;
  d: string;
  e: string;
  answer: string;
  answerGivenByStudent: string;
  difficultyLevel: DifficultyLevelType[];
  isCorrect: boolean;
  spendTime: string;
  marks: any;
}

export interface AnswerKeyForAdminInterface {
  _id: string;
  testName: string;
  duration: string;
  timeTakeByStudent: string;
  studentName: string;
  correctAnswer: number;
  unAttemptedAnswer: number;
  wrongAnswer: number;
  question: QuestionInterface[];
}

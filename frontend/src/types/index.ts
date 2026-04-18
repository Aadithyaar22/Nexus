export interface Document {
  id: string;
  _id?: string;
  title: string;
  filename: string;
  size: number;
  mimeType: string;
  chunkCount: number;
  status: 'processing' | 'ready' | 'failed';
  createdAt: string;
  summary?: Summary;
}

export interface Summary {
  short: string;
  keyPoints: string[];
  concepts: string[];
  generatedAt?: string;
}

export interface Source {
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  snippet: string;
  score: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: Source[];
  createdAt?: string;
}

export interface Chat {
  id: string;
  _id?: string;
  title: string;
  messages: ChatMessage[];
  scopedDocumentIds: string[];
  updatedAt: string;
}

export interface Flashcard {
  front: string;
  back: string;
  topic: string;
}

export interface MCQ {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ExamQuestion {
  question: string;
  type: 'short-answer' | 'long-answer' | 'analytical' | 'application';
  difficulty: 'easy' | 'medium' | 'hard';
  modelAnswer: string;
}

export interface CrossDocInsight {
  title: string;
  description: string;
  documents: string[];
  type: 'agreement' | 'contradiction' | 'extension' | 'analogy' | 'gap';
}

export interface AutoInsight {
  headline: string;
  body: string;
  tag: 'connection' | 'implication' | 'question' | 'pattern' | 'contrast';
}

export interface KnowledgeGap {
  concept: string;
  why: string;
  priority: 'high' | 'medium' | 'low';
  resources: string[];
}

export interface ConceptBattleSide {
  name: string;
  definition: string;
  strengths: string[];
  weaknesses: string[];
  bestFor: string[];
}

export interface ConceptBattleResult {
  conceptA: ConceptBattleSide;
  conceptB: ConceptBattleSide;
  keyDifferences: { dimension: string; a: string; b: string }[];
  whenToUseA: string;
  whenToUseB: string;
  verdict: string;
}

export interface KnowledgeFusionResult {
  thesis: string;
  pillars: { name: string; explanation: string; evidence: string[] }[];
  mentalModel: string;
  openQuestions: string[];
}

export interface Confusion {
  concept: string;
  commonMisconception: string;
  actualTruth: string;
  simpleExplanation: string;
  analogy: string;
  confusedWith: string[];
}

export type View =
  | 'workspace'
  | 'chat'
  | 'insights'
  | 'study'
  | 'battle'
  | 'fusion'
  | 'confusion'
  | 'gaps';

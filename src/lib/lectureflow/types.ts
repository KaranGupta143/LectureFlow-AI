export type Concept = {
  id: string;
  topic: string;
  subtopics: string[];
  definition: string;
};

export type Question = {
  question: string;
  type: "short" | "long";
  hint?: string;
};

export type AnalysisResult = {
  title: string;
  concepts: Concept[];
  questions: Question[];
};

export type ActionPlan = {
  revise: string[];
  practice: string[];
  focus: string[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

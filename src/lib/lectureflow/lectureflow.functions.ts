import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callGatewayJSON, callGatewayText } from "./ai.server";
import type { AnalysisResult, ActionPlan } from "./types";

const TEACHER_SYSTEM =
  "You are a warm, patient teacher for high-school and college students. " +
  "Always simplify concepts, use real-world examples, and avoid jargon. " +
  "Teach for understanding, not memorization.";

function normalizeTopic(source: string, index: number): string {
  const words = source
    .replace(/^[\d\-*.()\s]+/, "")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);
  if (words.length === 0) return `Concept ${index + 1}`;
  return words
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function extractConceptSeeds(notes: string): string[] {
  const lines = notes
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const bulletLines = lines.filter((line) => /^[-*•\d]/.test(line));
  const headingLines = lines.filter((line) => line.length <= 80 && /[A-Za-z]/.test(line));
  const pool = [...bulletLines, ...headingLines, ...lines];
  return [...new Set(pool)].slice(0, 5);
}

function localAnalyzeNotes(notes: string): AnalysisResult {
  const seeds = extractConceptSeeds(notes);
  const concepts = (seeds.length > 0 ? seeds : [notes.slice(0, 80)]).map((seed, index) => {
    const topic = normalizeTopic(seed, index);
    return {
      id: `concept-${index + 1}`,
      topic,
      subtopics: seed
        .split(/[,;:\-–]/)
        .map((part) => part.trim())
        .filter(Boolean)
        .slice(0, 3),
      definition:
        `${topic} is a core idea from the lecture. ` +
        `Read the surrounding notes to connect it with the bigger picture and recall the examples mentioned in class.`,
    };
  });

  const topicList = concepts.map((concept) => concept.topic);
  const questions = topicList.slice(0, 5).map((topic, index) => ({
    question: `Explain ${topic} and describe why it matters in the lecture.`,
    type: index % 2 === 0 ? "short" : "long",
    hint: `Focus on the definition, the main idea, and one example involving ${topic}.`,
  }));

  while (questions.length < 5) {
    const number = questions.length + 1;
    questions.push({
      question: `What is the most important takeaway from this part of the lecture?`,
      type: number % 2 === 0 ? "long" : "short",
      hint: "Summarize the key concept in plain language.",
    });
  }

  return {
    title: normalizeTopic(notes.split(/\r?\n+/).find((line) => line.trim().length > 0) ?? "Lecture notes", 0),
    concepts: concepts.slice(0, 10),
    questions,
  };
}

function localExplainConcept(topic: string, context?: string) {
  const contextSentence = context?.trim()
    ? ` In this lecture, it connects to: ${context.trim().slice(0, 240)}.`
    : "";

  return {
    simple: `${topic} is one of the main ideas in your notes. It helps explain how the lecture topics fit together and what you should remember for revision.${contextSentence}`,
    realLifeExample: `Think of ${topic.toLowerCase()} as a practical example of something you already do in everyday problem solving or decision making.`,
    solvedExample: `Step 1: Identify the part of the notes that describes ${topic}. Step 2: Restate it in your own words. Step 3: Apply it to a simple example from class.`,
  };
}

function localActionPlan(notes: string, concepts: string[], revised: string[]): ActionPlan {
  const pending = concepts.filter((concept) => !revised.includes(concept));
  const priority = pending.length > 0 ? pending : concepts;

  return {
    revise: priority.slice(0, 4).map((concept) => `Review ${concept} and write a one-sentence definition from memory.`),
    practice: priority.slice(0, 4).map((concept) => `Answer one self-test question about ${concept} without looking at the notes.`),
    focus: [
      notes.trim().length > 0
        ? "Re-read the most dense part of the lecture and convert it into simpler language."
        : "Pick one dense concept and rewrite it in simpler language.",
      "Link each concept to one real-world example or class example.",
      "Spend the last 10 minutes checking which ideas still feel fuzzy.",
    ],
  };
}

function localChatReply(messages: { role: "user" | "assistant"; content: string }[], context?: string): string {
  const latestUser = [...messages].reverse().find((message) => message.role === "user")?.content ?? "your question";
  const contextSnippet = context?.trim() ? ` I’m using the lecture context to stay aligned with your notes.` : "";
  return `Short answer: ${latestUser}${contextSnippet} Start with the definition, then connect it to one example from the lecture, and finish by asking yourself how it differs from nearby concepts.`;
}

async function runWithFallback<T>(operation: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const flag = process.env.LECTUREFLOW_ALLOW_LOCAL_FALLBACK?.toLowerCase();
    const allowFallback = flag !== "false";
    if (!allowFallback) throw error;
    return fallback();
  }
}

// 1. Analyze notes -> concepts + predicted questions
export const analyzeNotes = createServerFn({ method: "POST" })
  .inputValidator((d: { notes: string }) => z.object({ notes: z.string().min(20).max(40000) }).parse(d))
  .handler(async ({ data }): Promise<AnalysisResult> => {
    return runWithFallback(
      () =>
        callGatewayJSON<AnalysisResult>(
          [
            { role: "system", content: TEACHER_SYSTEM },
            {
              role: "user",
              content:
                "Analyze these lecture notes. Extract the key concepts (with subtopics + a clear definition) " +
                "and generate 5 predicted exam questions (mix of short and long answer). " +
                "Give each concept a short 'topic' (3-6 words). Definitions should be 1-2 sentences in plain English.\n\n" +
                "NOTES:\n" + data.notes,
            },
          ],
          "return_analysis",
          {
            type: "object",
            properties: {
              title: { type: "string", description: "A short title for this lecture (max 8 words)" },
              concepts: {
                type: "array",
                minItems: 3,
                maxItems: 10,
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    topic: { type: "string" },
                    subtopics: { type: "array", items: { type: "string" } },
                    definition: { type: "string" },
                  },
                  required: ["id", "topic", "subtopics", "definition"],
                  additionalProperties: false,
                },
              },
              questions: {
                type: "array",
                minItems: 5,
                maxItems: 5,
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    type: { type: "string", enum: ["short", "long"] },
                    hint: { type: "string" },
                  },
                  required: ["question", "type"],
                  additionalProperties: false,
                },
              },
            },
            required: ["title", "concepts", "questions"],
            additionalProperties: false,
          },
        ),
      () => localAnalyzeNotes(data.notes),
    );
  });

// 2. Explain a concept like a teacher
export const explainConcept = createServerFn({ method: "POST" })
  .inputValidator((d: { topic: string; context?: string }) =>
    z.object({ topic: z.string().min(1).max(300), context: z.string().max(40000).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    return runWithFallback(
      () =>
        callGatewayJSON<{
          simple: string;
          realLifeExample: string;
          solvedExample: string;
        }>(
          [
            { role: "system", content: TEACHER_SYSTEM },
            {
              role: "user",
              content:
                `Teach me the concept: "${data.topic}".\n` +
                (data.context ? `Lecture context:\n${data.context.slice(0, 8000)}\n\n` : "") +
                "Give a simple explanation, one real-life example, and one fully solved example.",
            },
          ],
          "return_explanation",
          {
            type: "object",
            properties: {
              simple: { type: "string", description: "Plain-English explanation, 3-6 sentences" },
              realLifeExample: { type: "string", description: "An everyday analogy or scenario" },
              solvedExample: { type: "string", description: "A worked example with steps" },
            },
            required: ["simple", "realLifeExample", "solvedExample"],
            additionalProperties: false,
          },
        ),
      () => localExplainConcept(data.topic, data.context),
    );
  });

// 3. Action plan generator (the WOW feature)
export const generateActionPlan = createServerFn({ method: "POST" })
  .inputValidator((d: { notes: string; concepts: string[]; revised: string[] }) =>
    z
      .object({
        notes: z.string().min(1).max(40000),
        concepts: z.array(z.string()).max(50),
        revised: z.array(z.string()).max(50),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<ActionPlan> => {
    return runWithFallback(
      () => {
        const pending = data.concepts.filter((c) => !data.revised.includes(c));
        return callGatewayJSON<ActionPlan>(
          [
            { role: "system", content: TEACHER_SYSTEM },
            {
              role: "user",
              content:
                "Build a concrete study action plan for today based on this lecture.\n" +
                `All concepts: ${data.concepts.join(", ")}\n` +
                `Already revised: ${data.revised.join(", ") || "none"}\n` +
                `Still pending: ${pending.join(", ") || "none"}\n\n` +
                "Lecture notes (truncated):\n" + data.notes.slice(0, 6000) +
                "\n\nReturn 3 short bullet lists: what to revise today, what to practice, what to focus on next. " +
                "Each item should be 1 sentence, action-oriented, specific to the topics above.",
            },
          ],
          "return_action_plan",
          {
            type: "object",
            properties: {
              revise: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
              practice: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
              focus: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
            },
            required: ["revise", "practice", "focus"],
            additionalProperties: false,
          },
        );
      },
      () => localActionPlan(data.notes, data.concepts, data.revised),
    );
  });

// 4. Doubt mode chat
export const chatDoubt = createServerFn({ method: "POST" })
  .inputValidator((d: { messages: { role: "user" | "assistant"; content: string }[]; context?: string }) =>
    z
      .object({
        messages: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().min(1).max(4000),
            }),
          )
          .min(1)
          .max(40),
        context: z.string().max(40000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sys =
      TEACHER_SYSTEM +
      (data.context
        ? `\n\nThe student is studying these lecture notes:\n${data.context.slice(0, 8000)}`
        : "");
    return runWithFallback(
      async () => ({
        reply: await callGatewayText([{ role: "system", content: sys }, ...data.messages]),
      }),
      () => ({ reply: localChatReply(data.messages, data.context) }),
    );
  });

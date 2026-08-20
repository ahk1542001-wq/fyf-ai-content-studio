import { generateText, generateObject } from 'ai';
import { createVertex } from '@ai-sdk/google-vertex';
import { z } from 'zod';

export const FYF_VERTEX_MODELS = {
  creator: process.env.FYF_CREATOR_MODEL_ID?.trim() || 'gemini-3.5-flash',
  editor: process.env.FYF_EDITOR_MODEL_ID?.trim() || 'gemini-3.5-flash-lite',
  location: process.env.GOOGLE_VERTEX_LOCATION?.trim() || 'us',
} as const;

// Setup Vertex AI provider
// The US multi-region preserves the existing US processing boundary while
// supporting the GA Gemini 3 migration targets. Environment overrides provide
// an explicit rollback seam without changing source code.
const vertex = createVertex({
  project: process.env.GOOGLE_PROJECT_ID,
  location: FYF_VERTEX_MODELS.location,
});

export const ReviewDraftResultSchema = z.object({
  passed: z.boolean().describe('True if all 5 brand voice criteria pass.'),
  burmeseClarity: z.boolean().describe('Natural, readable Burmese phrasing with proper spacing.'),
  brandVoice: z.boolean().describe('Calm, disciplined practitioner mentor tone without hype or buzzwords.'),
  humanBoundary: z.boolean().describe('Explicit human-in-the-loop decision boundary (AI assist vs human decision).'),
  endingQuestion: z.boolean().describe('Thought-provoking closing question for business operators.'),
  safetyPass: z.boolean().describe('No prohibited phrases, guaranteed profits, or unsafe financial advice.'),
  feedback: z.string().optional().describe('Actionable feedback explaining what failed and how to fix it.')
});

export type ReviewDraftResult = z.infer<typeof ReviewDraftResultSchema>;

/**
 * Adapter for calling Google Gemini Models via Vercel AI SDK on Vertex AI.
 */
export class LLMGateway {
  static async generateFromPrompt(prompt: string): Promise<string> {
    const { text } = await generateText({
      model: vertex(FYF_VERTEX_MODELS.creator),
      prompt,
      temperature: 0.7,
    });

    return text;
  }

  /**
   * Creator Agent (Maker)
   * Uses the GA Gemini 3.5 Flash migration target for Gemini 2.5 Pro.
   */
  static async createDraft(topic: string, businessGoal: string, brandExamples: string[]): Promise<string> {
    const formattedExamples = brandExamples.length > 0
      ? brandExamples.join('\n\n---\n\n')
      : 'No examples provided. Use a calm, practitioner-grounded Burmese mentor tone.';

    const prompt = `You are the Creator Agent for FYF AI (For Your Future), writing Facebook posts for Burmese SME business owners, solo founders, and team leads.

Core Mission:
Explain AI automation and practical workflows in 100% plain, beginner-friendly Burmese. Connect directly to everyday business situations (customer orders, stock balance, payment slips, chat responses, daily sales reports).

Language & Tone Guidelines:
- Language: Authentic, natural Burmese (Myanmar Unicode) with generous, readable spacing. No English explanations or filler.
- Tone: Calm, disciplined, practitioner-grounded mentor voice. Strictly NO hype, NO fluff, NO buzzwords, and NO exaggerated marketing promises.
- STRICT NO-JARGON RULE: Never use intimidating technical terms (e.g. do NOT use "Data Ingestion", "LangGraph State Machine", "Maker/Checker", "OCR Pipeline", "Latency", "Benchmark"). Use plain everyday phrases: "Chat က အော်ဒါစာရင်းတွေ ကူမှတ်တာ", "ငွေလွှဲဘောက်ချာ စာလုံးဖတ်တာ", "မန်နေဂျာက ဝင်စစ်တာ", "AI လက်ထောက်လေး".
- If introducing a new tech concept (e.g. Grok Bot, Multi-Agent), explain WHAT IT IS first in 1 simple sentence using a relatable analogy (e.g. like a team of junior assistants with different tasks).
- Always establish clear human-in-the-loop decision boundaries (human verification gates before financial/operational actions).

Post Structure:
1. Relatable Hook: Start with a concrete daily business situation or operational pain point.
2. Simple Explanation: What AI actually does to help in plain Burmese vs what business context or risk AI cannot see.
3. Human Decision Boundary: Explicitly establish what AI assists vs what the human business owner/manager verifies and decides.
4. Core Takeaway / Rule: A concise, memorable guiding rule (e.g. "AI ကို စာရင်းကူရေးခိုင်းပါ။ စီးပွားရေး ဆုံးဖြတ်ချက်ကိုတော့ မလွှဲပါနဲ့။").
5. Reflective Closing Question: End with a thoughtful question prompting business owners to examine their own workflow (no generic engagement bait).

Topic: ${topic}
Business Goal: ${businessGoal}

Approved FYF Reference Examples for Tone & Structure:
${formattedExamples}

Output ONLY the final Burmese Facebook post text. Do not include introductory or concluding conversational filler.`;

    return this.generateFromPrompt(prompt);
  }

  /**
   * Editor Agent (Checker)
   * Uses the GA Gemini 3.5 Flash-Lite migration target for Gemini 2.5 Flash.
   */
  static async reviewDraft(draft: string): Promise<ReviewDraftResult> {
    const prompt = `You are the Editor / Checker Agent for FYF AI. Review the following Facebook post draft written for Burmese SME business owners.

Evaluate the draft against the following 5-point FYF brand rubric:
1. burmeseClarity: Is the text written in natural, fluent Burmese (Myanmar Unicode) with proper word spacing?
2. brandVoice: Is the tone calm, disciplined, and practitioner-grounded without marketing hype, fluff, or buzzwords?
3. humanBoundary: Does the post establish an explicit human-in-the-loop decision boundary (distinguishing AI assistance from human responsibility and final decision)?
4. endingQuestion: Does the post conclude with a thoughtful, reflective question prompting business owners to think about their workflow?
5. safetyPass: Is the draft free of prohibited phrases (such as guaranteed profit, 100% automated, get rich quick) and unsafe advice?

Rule:
- "passed" must be true ONLY IF all 5 criteria (burmeseClarity, brandVoice, humanBoundary, endingQuestion, safetyPass) are true.
- If any criterion fails, provide clear, actionable feedback in Burmese explaining what needs to be revised.

Draft to Review:
"""
${draft}
"""`;

    const { object } = await generateObject({
      model: vertex(FYF_VERTEX_MODELS.editor),
      schema: ReviewDraftResultSchema,
      prompt,
    });

    return object;
  }
}

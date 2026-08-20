import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateText = vi.fn();
const generateObject = vi.fn();
const vertexModel = vi.fn((modelId: string) => ({ modelId }));
const createVertex = vi.fn(() => vertexModel);

vi.mock('ai', () => ({
  generateText,
  generateObject,
}));

vi.mock('@ai-sdk/google-vertex', () => ({
  createVertex,
}));

describe('LLMGateway Gemini 3 migration and Maker/Checker alignment', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    generateText.mockResolvedValue({ text: 'draft' });
    generateObject.mockResolvedValue({
      object: {
        passed: true,
        burmeseClarity: true,
        brandVoice: true,
        humanBoundary: true,
        endingQuestion: true,
        safetyPass: true,
        feedback: undefined
      }
    });
  });

  it('uses the GA Gemini 3 models through the US multi-region endpoint', async () => {
    const { FYF_VERTEX_MODELS, LLMGateway } = await import('@/src/infrastructure/llm/gateway');

    expect(FYF_VERTEX_MODELS).toEqual({
      creator: 'gemini-3.5-flash',
      editor: 'gemini-3.5-flash-lite',
      location: 'us',
    });
    expect(createVertex).toHaveBeenCalledWith({
      project: process.env.GOOGLE_PROJECT_ID,
      location: 'us',
    });

    await LLMGateway.createDraft('topic', 'goal', []);
    await LLMGateway.reviewDraft('draft');

    expect(vertexModel).toHaveBeenNthCalledWith(1, 'gemini-3.5-flash');
    expect(vertexModel).toHaveBeenNthCalledWith(2, 'gemini-3.5-flash-lite');
  });

  it('does not send unsupported custom sampling parameters to Flash-Lite', async () => {
    const { LLMGateway } = await import('@/src/infrastructure/llm/gateway');

    await LLMGateway.reviewDraft('draft');

    expect(generateObject).toHaveBeenCalledOnce();
    expect(generateObject.mock.calls[0][0]).not.toHaveProperty('temperature');
    expect(generateObject.mock.calls[0][0]).not.toHaveProperty('topK');
    expect(generateObject.mock.calls[0][0]).not.toHaveProperty('topP');
  });

  it('formats few-shot style examples and Burmese brand instructions into the Creator prompt', async () => {
    const { LLMGateway } = await import('@/src/infrastructure/llm/gateway');

    const examples = [
      '[Topic: Human Approval]\nAI ကို အလုပ်ပေးပါ။ ဆုံးဖြတ်ချက်နဲ့ တာဝန်ကိုတော့ မပေးလိုက်ပါနဲ့။',
      '[Topic: Sales Report]\nReport ကို automate လုပ်ပါ။ ဆုံးဖြတ်ချက်ကိုတော့ မလွှဲပါနဲ့။'
    ];

    await LLMGateway.createDraft('Inventory Sync Failure', 'Educate SME owners on risk', examples);

    expect(generateText).toHaveBeenCalledOnce();
    const promptArg = generateText.mock.calls[0][0].prompt as string;
    expect(promptArg).toContain('Creator Agent for FYF AI');
    expect(promptArg).toContain('Burmese');
    expect(promptArg).toContain('human-in-the-loop decision boundaries');
    expect(promptArg).toContain('Topic: Inventory Sync Failure');
    expect(promptArg).toContain('Human Approval');
    expect(promptArg).toContain('Sales Report');
    expect(promptArg).toContain('ဆုံးဖြတ်ချက်နဲ့ တာဝန်ကိုတော့ မပေးလိုက်ပါနဲ့။');
  });

  it('evaluates drafts against the 5-point FYF brand rubric in reviewDraft', async () => {
    const { LLMGateway, ReviewDraftResultSchema } = await import('@/src/infrastructure/llm/gateway');

    const draftText = 'AI ကို အလုပ်ပေးပါ။ ဆုံးဖြတ်ချက်နဲ့ တာဝန်ကိုတော့ မပေးလိုက်ပါနဲ့။ အခု Weekly Report မှာ လူက manually လုပ်နေရတဲ့ step က ဘာလဲ?';
    const result = await LLMGateway.reviewDraft(draftText);

    expect(generateObject).toHaveBeenCalledOnce();
    const callArg = generateObject.mock.calls[0][0];
    expect(callArg.prompt).toContain('5-point FYF brand rubric');
    expect(callArg.prompt).toContain('burmeseClarity');
    expect(callArg.prompt).toContain('brandVoice');
    expect(callArg.prompt).toContain('humanBoundary');
    expect(callArg.prompt).toContain('endingQuestion');
    expect(callArg.prompt).toContain('safetyPass');
    expect(callArg.schema).toBe(ReviewDraftResultSchema);

    expect(result).toEqual({
      passed: true,
      burmeseClarity: true,
      brandVoice: true,
      humanBoundary: true,
      endingQuestion: true,
      safetyPass: true,
      feedback: undefined
    });
  });

  it('handles reviewDraft failure with structured rubric breakdown and feedback', async () => {
    generateObject.mockResolvedValueOnce({
      object: {
        passed: false,
        burmeseClarity: true,
        brandVoice: false,
        humanBoundary: false,
        endingQuestion: false,
        safetyPass: true,
        feedback: 'Please add explicit human decision boundary and reflective closing question.'
      }
    });

    const { LLMGateway } = await import('@/src/infrastructure/llm/gateway');
    const result = await LLMGateway.reviewDraft('Generic post without human boundary');

    expect(result.passed).toBe(false);
    expect(result.humanBoundary).toBe(false);
    expect(result.endingQuestion).toBe(false);
    expect(result.feedback).toContain('human decision boundary');
  });

  it('validates ReviewDraftResultSchema correctly with Zod', async () => {
    const { ReviewDraftResultSchema } = await import('@/src/infrastructure/llm/gateway');

    const validData = {
      passed: true,
      burmeseClarity: true,
      brandVoice: true,
      humanBoundary: true,
      endingQuestion: true,
      safetyPass: true,
      feedback: 'Good job'
    };

    const parsed = ReviewDraftResultSchema.parse(validData);
    expect(parsed).toEqual(validData);

    const invalidData = {
      passed: true,
      burmeseClarity: 'not a boolean'
    };
    expect(() => ReviewDraftResultSchema.parse(invalidData)).toThrow();
  });
});

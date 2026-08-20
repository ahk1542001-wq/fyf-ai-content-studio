import { WorkflowState } from '../state';
import { AIMessage } from '@langchain/core/messages';
import { LLMGateway } from '../../infrastructure/llm/gateway';
import { styleExamples } from '../../../database/demo-data/demoData';

/**
 * The Creator Agent Node (Maker).
 * Uses Gemini Pro to read the brief and output a complete draft.
 */
export async function creatorNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  console.log('--- [Node] Creator Agent: Drafting Content ---');

  // Load approved FYF brand examples for workspace ws-fyf
  const brandExamples = styleExamples
    .filter((example) => example.workspaceId === 'ws-fyf')
    .map((example) => `[Topic: ${example.topic}]\n${example.content}`);

  // Call the Gemini Pro model via our LiteLLM Gateway Adapter
  let draft = '';
  if (state.status === 'revising' && state.reviewFeedback) {
    // If revising, pass the previous draft and feedback
    draft = await LLMGateway.createDraft(
      `${state.brief.topic} (Note: Revise previous draft. Feedback: ${state.reviewFeedback})`,
      state.brief.businessGoal,
      brandExamples
    );
  } else {
    // Initial draft
    draft = await LLMGateway.createDraft(state.brief.topic, state.brief.businessGoal, brandExamples);
  }

  return {
    draftContent: draft,
    status: 'reviewing',
    messages: [
      ...state.messages,
      new AIMessage({ content: draft, name: 'creator_agent' })
    ]
  };
}

import { WorkflowState } from '../state';
import { AIMessage } from '@langchain/core/messages';
import { LLMGateway } from '../../infrastructure/llm/gateway';

/**
 * The Editor Agent Node (Checker).
 * Uses Gemini Flash to review the draft and ensure policy compliance.
 */
export async function editorNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  console.log('--- [Node] Editor Agent: Reviewing Content ---');

  if (!state.draftContent) {
    throw new Error('No draft content available to review.');
  }

  // Call the Gemini Flash model via our Gateway Adapter
  const reviewResult = await LLMGateway.reviewDraft(state.draftContent);

  if (reviewResult.passed) {
    console.log('   -> Draft Approved by Editor');
    return {
      status: 'ready_for_human',
      messages: [
        ...state.messages,
        new AIMessage({ content: 'Review Passed. Ready for human approval.', name: 'editor_agent' })
      ]
    };
  } else {
    console.log('   -> Draft Rejected. Sending back to Creator.');
    const newRevisionCount = state.revisionCount + 1;
    const feedbackText = reviewResult.feedback || 'FYF brand voice rubric check failed. Please ensure natural Burmese, calm mentor tone, explicit human decision boundary, ending question, and safety compliance.';

    // Strict Revision Limit (Max 2 automated revisions)
    if (newRevisionCount >= 2) {
      console.log('   -> Max revisions reached. Needs Human Review.');
      return {
        status: 'needs_human_review',
        revisionCount: newRevisionCount,
        reviewFeedback: feedbackText,
      };
    }

    return {
      status: 'revising',
      revisionCount: newRevisionCount,
      reviewFeedback: feedbackText,
      messages: [
        ...state.messages,
        new AIMessage({ content: `Review Failed: ${feedbackText}`, name: 'editor_agent' })
      ]
    };
  }
}

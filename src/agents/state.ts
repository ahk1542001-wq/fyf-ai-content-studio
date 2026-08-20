import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';

export interface WorkflowState {
  brief: {
    topic: string;
    businessGoal: string;
    format: string; // e.g., 'facebook_post'
    tone?: string;
  };
  messages: BaseMessage[];
  draftContent?: string;
  reviewFeedback?: string;
  revisionCount: number;
  status: 'initialized' | 'drafting' | 'reviewing' | 'revising' | 'ready_for_human' | 'needs_human_review';
}

export const StateAnnotation = Annotation.Root({
  brief: Annotation<WorkflowState['brief']>({
    reducer: (x, y) => y ?? x,
    default: () => ({ topic: '', businessGoal: '', format: '' })
  }),
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  draftContent: Annotation<WorkflowState['draftContent']>({
    reducer: (x, y) => y ?? x,
    default: () => undefined
  }),
  reviewFeedback: Annotation<WorkflowState['reviewFeedback']>({
    reducer: (x, y) => y ?? x,
    default: () => undefined
  }),
  revisionCount: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
  status: Annotation<WorkflowState['status']>({
    reducer: (x, y) => y ?? x,
    default: () => 'initialized',
  })
});

export function getInitialState(brief: WorkflowState['brief']): Partial<WorkflowState> {
  return {
    brief,
    messages: [],
    revisionCount: 0,
    status: 'initialized',
  };
}

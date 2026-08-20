import { StateGraph, START, END } from '@langchain/langgraph';
import { StateAnnotation } from './state';
import { creatorNode } from './nodes/creator';
import { editorNode } from './nodes/editor';

// 1. Define the State Graph structure.
const workflow = new StateGraph(StateAnnotation)
  // 2. Add Nodes (Agents)
  .addNode('creator', creatorNode)
  .addNode('editor', editorNode)

  // 3. Define the Edges (Control Flow)
  // Start -> Creator -> Editor -> End (or loop back to Creator)
  .addEdge(START, 'creator')
  .addEdge('creator', 'editor')

  // Conditional Edge: If editor fails, go back to creator (unless limit reached). If it passes, go to END.
  .addConditionalEdges('editor', (state: typeof StateAnnotation.State) => {
    if (state.status === 'revising') {
      return 'creator'; // Loop back
    }
    return END; // Finished, ready_for_human or needs_human_review
  });

// 4. Compile the Graph
export const fyfAgentGraph = workflow.compile();

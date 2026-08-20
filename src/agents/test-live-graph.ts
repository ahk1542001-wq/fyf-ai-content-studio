import { fyfAgentGraph } from './graph';
import { getInitialState } from './state';
import 'dotenv/config';

async function testWorkflow() {
  console.log('Starting FYF Agent Workflow Test with Real Vertex AI Gemini...\n');

  if (!process.env.GOOGLE_PROJECT_ID || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('❌ Missing GCP Credentials in environment.');
    console.log('Please add GOOGLE_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS to your .env.local file.');
    return;
  }

  // 1. Setup the initial input
  const initialState = getInitialState({
    topic: 'How AI Automation saves 10 hours a week for businesses',
    businessGoal: 'Encourage users to message us for a free consultation',
    format: 'facebook_post'
  });

  // 2. Run the graph
  try {
    const finalState = await fyfAgentGraph.invoke(initialState);

    // 3. Output the result
    console.log('\n--- FINAL WORKFLOW RESULT ---');
    console.log('Status:', finalState.status);
    console.log('\nDraft Content:\n', finalState.draftContent);
    console.log('\nMessage History (Audit):');
    finalState.messages.forEach((message) => {
      console.log(
        `[${message.name ?? message.getType()}]: ${String(message.content).substring(0, 80).replace(/\n/g, ' ')}...`
      );
    });
  } catch (error) {
    console.error('\n❌ Workflow Execution Failed:', error);
  }
}

testWorkflow();

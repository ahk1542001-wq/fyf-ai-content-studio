import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'app'
  }
});

const fyfExamples = [
  {
    pillar: "knowledge",
    topic: "AI Agent Architecture",
    content: "AI Agents တွေ ဘယ်လိုအလုပ်လုပ်လဲ?\n\nနောက်ပိုင်းမှာ AI Agent တွေက ကိုယ့်ကိုယ်စား အလုပ်တွေလုပ်ပေးမယ့် ခေတ်ကိုရောက်လာပြီ။ ဒါပေမယ့် သူတို့ ဘယ်လို ဆုံးဖြတ်ချက်ချလဲ? LangGraph လို tool တွေသုံးပြီး State Machine တွေနဲ့ သူတို့ကို ထိန်းချုပ်လို့ရတယ်။\n\n📌 အဓိက မှတ်ထားရမှာက AI ဟာ ကိုယ်ပေးတဲ့ Data နဲ့ System Architecture အပေါ်မှာပဲ မူတည်ပြီး အလုပ်လုပ်တာပါ။"
  },
  {
    pillar: "personal_growth",
    topic: "System vs Goals",
    content: "Goals တွေက သွားချင်တဲ့ ပန်းတိုင်ဖြစ်ပြီး၊ Systems တွေက အဲဒီပန်းတိုင်ကို ရောက်အောင်သွားမယ့် လမ်းကြောင်းပါ။\n\nအမြဲတမ်း ပန်းတိုင်ကိုပဲ ကြည့်မနေဘဲ ကိုယ့်ရဲ့ နေ့စဉ်လုပ်ငန်းစဉ် (System) ကို ပိုပြီး အာရုံစိုက်ပါ။ System ကောင်းရင် ရလဒ်က အလိုလို ရလာပါလိမ့်မယ်။ 🎯"
  },
  {
    pillar: "general",
    topic: "Continuous Learning",
    content: "နည်းပညာတွေ အမြဲပြောင်းလဲနေတဲ့ခေတ်မှာ အရေးအကြီးဆုံး Skill က 'သင်ယူနိုင်စွမ်း' (Learnability) ပါပဲ။\n\nမနေ့က သိခဲ့တဲ့အရာက ဒီနေ့ အသုံးမဝင်တော့တာ ဖြစ်နိုင်တယ်။ ဒါကြောင့် အမြဲတမ်း မျက်စိဖွင့် နားစွင့်ပြီး အသစ်တွေကို လေ့လာနေဖို့ လိုပါတယ်။ 💡"
  }
];

async function seed() {
  console.log("Starting to seed brand examples...");

  // 1. Get or create a Workspace
  const { data: workspaces, error: wsError } = await supabase
    .from('workspaces')
    .select('id')
    .limit(1);

  if (wsError) {
    console.error("Error fetching workspace:", wsError);
    return;
  }

  let workspaceId;

  if (!workspaces || workspaces.length === 0) {
    console.log("No workspace found. Creating 'FYF Default Workspace'...");
    const { data: newWs, error: createWsError } = await supabase
      .schema('app')
      .from('workspaces')
      .insert({ name: 'FYF Default Workspace', page_name: 'FYF Page' })
      .select()
      .single();

    if (createWsError) {
      console.error("Failed to create workspace:", createWsError);
      return;
    }
    workspaceId = newWs.id;
    console.log(`Workspace created: ${workspaceId}`);
  } else {
    workspaceId = workspaces[0].id;
    console.log(`Using existing workspace: ${workspaceId}`);
  }

  // 2. Insert Examples
  console.log("Inserting FYF Examples...");
  const examplesWithWorkspace = fyfExamples.map(ex => ({
    ...ex,
    workspace_id: workspaceId
  }));

  const { error: insertError } = await supabase
    .from('brand_examples')
    .insert(examplesWithWorkspace);

  if (insertError) {
    console.error("Error inserting brand examples:", insertError);
  } else {
    console.log("✅ Successfully seeded FYF Brand Examples!");
  }
}

seed().catch(console.error);

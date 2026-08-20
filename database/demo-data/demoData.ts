import type {
  AnalyticsSnapshot,
  AuditEvent,
  BrandProfile,
  ContentIdea,
  DemoUser,
  Draft,
  DraftVersion,
  IntegrationLog,
  IntegrationSetting,
  MediaAsset,
  OnboardingChecklistItem,
  PromptVersion,
  PublishJob,
  ScheduleJob,
  StyleExample,
  WorkspaceMember,
  Workspace
} from "@/backend/types";

export const demoUsers: DemoUser[] = [
  {
    id: "user-demo-owner",
    name: "Demo User",
    email: "demo@fyf.local"
  }
];

export const demoWorkspaces: Workspace[] = [
  {
    id: "ws-fyf",
    name: "FYF AI",
    pageName: "FYF AI",
    demoMode: true,
    riskSensitivity: "strict"
  },
  {
    id: "ws-agency",
    name: "Star Digital Agency",
    pageName: "Star Digital",
    demoMode: true,
    riskSensitivity: "standard"
  }
];

export const workspaceMembers: WorkspaceMember[] = [
  {
    id: "member-fyf-owner",
    workspaceId: "ws-fyf",
    userId: "user-demo-owner",
    role: "owner"
  },
  {
    id: "member-agency-owner",
    workspaceId: "ws-agency",
    userId: "user-demo-owner",
    role: "owner"
  }
];

export const styleExamples: StyleExample[] = [
  {
    id: "ex-t1",
    workspaceId: "ws-fyf",
    topic: "Human Approval & Decision Accountability",
    content:
      "AI ကို post တစ်ပုဒ် ရေးခိုင်းလိုက်တယ်။\n\nစာလုံးတွေမှန်တယ်။  \nStructure ကောင်းတယ်။  \nProfessional လည်းဖြစ်တယ်။\n\nဒါပေမယ့် ဖတ်ပြီးသွားတဲ့အခါ ဘာမှမကျန်ခဲ့ဘူး။\n\nမမှားဘူး။ ဒါပေမယ့် ဘယ်သူမဆို ရေးနိုင်တဲ့စာဖြစ်နေတယ်။\n\nAI က စာမရေးတတ်လို့ မဟုတ်ပါဘူး။\n\nဘာကိုပြောမလဲ၊ ဘယ်အမြင်ကို ရပ်တည်မလဲဆိုတဲ့ ဆုံးဖြတ်ချက်ကိုပါ AI ဆီပေးလိုက်မိလို့ပါ။\n\nBusiness မှာလည်း ဒီလိုပါပဲ။\n\nAI ကို information စုခိုင်းလို့ရတယ်။  \nFirst draft ရေးခိုင်းလို့ရတယ်။  \nရွေးချယ်စရာတွေ ထုတ်ခိုင်းလို့ရတယ်။\n\nဒါပေမယ့်—\n\nClient ဆီ ဘာ message ပို့မလဲ။  \nဘယ်ဈေးနှုန်းနဲ့ proposal ပေးမလဲ။  \nဘယ် content ကို publish လုပ်မလဲ။\n\nဒီလိုဆုံးဖြတ်ချက်တွေကို AI ဆီ လုံးဝလွှဲပေးလို့ မရပါဘူး။\n\nHuman Approval ဆိုတာ “OK” ခလုတ်နှိပ်တာလောက် မဟုတ်ဘူး။\n\n“ဒီစာက တကယ်ပြောချင်တာ ဟုတ်လား?”  \n“ဖတ်မယ့်သူအတွက် တကယ်အသုံးဝင်လား?”  \n“မှားသွားရင် ဘယ်သူတာဝန်ယူမလဲ?”\n\nဒီမေးခွန်းတွေကို AI က အကြံပေးနိုင်တယ်။  \nနောက်ဆုံးအဖြေကိုတော့ လူကပဲပေးရမယ်။\n\nယုံကြည်ရတဲ့ AI System ဆိုတာ အရာအားလုံးကို သူ့ဘာသာလုပ်ပေးတဲ့ system မဟုတ်ဘူး။\n\nဘယ်အလုပ်ကို ဆက်လုပ်ရမလဲ၊ ဘယ်နေရာမှာ ရပ်ပြီး လူကိုမေးရမလဲ သိတဲ့ system ဖြစ်တယ်။\n\nAI ကို အလုပ်ပေးပါ။  \nဆုံးဖြတ်ချက်နဲ့ တာဝန်ကိုတော့ မပေးလိုက်ပါနဲ့။"
  },
  {
    id: "ex-t2",
    workspaceId: "ws-fyf",
    topic: "Sales Report Workflow & Business Context",
    content:
      "ဥပမာ—\n\nတနင်္လာမနက် Weekly Sales Report ထွက်လာတယ်။  \nProduct တစ်ခုရဲ့ အရောင်းက သိသိသာသာကျနေတယ်။\n\nAI က Promotion လုပ်ဖို့ အကြံပေးတယ်။\n\nဒါနဲ့ Promotion ချက်ချင်းလုပ်လိုက်သင့်လား?\n\nမသင့်သေးပါဘူး။\n\nAI မြင်တာက သူ့ကိုပေးထားတဲ့ Data ထဲက Pattern ပါ။\n\nReport ထဲမှာ မပါတဲ့အကြောင်းအရာတွေ ရှိနိုင်တယ်—\n\nStock မလုံလောက်တာလား။  \nCampaign ပြီးသွားတာလား။  \nMargin ကျသွားနိုင်လား။  \nCustomer complaint အသစ်ရှိနေလား။  \nBusiness ရဲ့ လက်ရှိဦးစားပေးက ဘာလဲ။\n\nဒီ Context တွေမစစ်ဘဲ AI ရဲ့ Recommendation ကို တိုက်ရိုက်လုပ်ဆောင်လိုက်ရင် Report ကမြန်သွားပေမယ့် Decision ကောင်းမလာနိုင်ပါဘူး။\n\nပိုယုံကြည်ရတဲ့ Workflow က ဒီလိုပါ—\n\nSales၊ Order နဲ့ Stock Data တွေကို Automation က စုစည်းမယ်။  \nAI က Trend၊ ထူးခြားချက်နဲ့ မပြည့်စုံသေးတဲ့အချက်တွေကို ဖော်ထုတ်မယ်။  \nလူက Business Context၊ Margin နဲ့ Risk ကို ပြန်စစ်မယ်။  \nပြီးမှ Price၊ Promotion ဒါမှမဟုတ် Inventory ဆိုင်ရာဆုံးဖြတ်ချက်ကို ချမယ်။\n\nAI Agent ရဲ့တန်ဖိုးက Business Owner အစား ဆုံးဖြတ်ပေးခြင်း မဟုတ်ပါဘူး။\n\nဆုံးဖြတ်ချက်ကောင်းတစ်ခုချနိုင်အောင် Data၊ Pattern၊ မေးခွန်းနဲ့ ရွေးချယ်စရာတွေကို အချိန်မီတင်ပြပေးခြင်းပါ။\n\nReport ကို automate လုပ်ပါ။  \nဆုံးဖြတ်ချက်ကိုတော့ မလွှဲပါနဲ့။\n\nအခုလုပ်နေတဲ့ Weekly Report မှာ လူက manually စုနေရတဲ့ Step က ဘယ်ဟာလဲ?"
  },
  {
    id: "ex-t3",
    workspaceId: "ws-fyf",
    topic: "Stock Desync & Operational Failure Risk",
    content:
      "Stock လက်ကျန်က ၁၂ ခု။  \nSystem ထဲမှာတော့ ၂ ခုလို့ပြနေတယ်။\n\nဒီအခြေအနေမှာ AI Agent က `Stock နည်းရင် ပြန်မှာမယ်` ဆိုတဲ့ rule အတိုင်း Supplier ဆီ Purchase Order ပို့လိုက်တယ်ဆိုပါစို့။\n\nအလုပ်က မြန်သွားတယ်။  \nဒါပေမယ့် မလိုအပ်တဲ့ Stock တွေ ထပ်ဝယ်မိသွားတယ်။\n\nပြဿနာက AI က rule မလိုက်နာလို့ မဟုတ်ပါဘူး။\n\nAI မြင်နေရတဲ့ Data က အချိန်မီ Update မဖြစ်တာ။  \nလမ်းမှာရောက်နေတဲ့ Order ကို System က မသိတာ။  \nနောက်ဆုံး Purchase မလုပ်ခင် လူက ပြန်စစ်ရမယ့်နေရာ မရှိတာပါ။\n\nဒီလို Workflow မှာ AI ကို လုပ်ခိုင်းလို့ရတာက—\n\nStock နည်းနေတဲ့ Product တွေ ရှာဖို့။  \nSales trend နဲ့ လက်ရှိ Stock ကို နှိုင်းယှဉ်ဖို့။  \nဘယ်လောက်ပြန်မှာသင့်လဲ အကြံပြုဖို့။  \nMissing Data နဲ့ မသေချာတဲ့အချက်တွေကို သတိပေးဖို့။\n\nဒါပေမယ့် Supplier ဆီ Purchase Order တကယ်ပို့မယ့်အချိန်မှာတော့—\n\nလက်ရှိ Stock မှန်မမှန်။  \nလာနေဆဲ Order ရှိမရှိ။  \nCash flow နဲ့ Storage အဆင်ပြေမပြေ။\n\nဒီ Context တွေကို လူက ပြန်စစ်ပြီးမှ Approve လုပ်သင့်ပါတယ်။\n\nကောင်းတဲ့ AI Agent ဆိုတာ Action အားလုံးကို မြန်မြန်လုပ်ပေးတဲ့ Agent မဟုတ်ပါဘူး။\n\nData မပြည့်တဲ့အချိန်မှာ ရပ်တတ်ပြီး Final Action မတိုင်ခင် လူကိုမေးတတ်တဲ့ Agent ဖြစ်ပါတယ်။\n\nAI ကို Recommendation အထိလုပ်ခိုင်းပါ။  \nငွေကုန်မယ့်ဆုံးဖြတ်ချက်ကိုတော့ Approval မပါဘဲ မလုပ်ခိုင်းပါနဲ့။\n\nသင့်လုပ်ငန်းမှာ AI ကို လုံးဝမအပ်သင့်သေးတဲ့ Final Action တစ်ခုက ဘာဖြစ်မလဲ?"
  },
  {
    id: "ex-t4",
    workspaceId: "ws-fyf",
    topic: "Payment Slip OCR & Financial Verification Gate",
    content:
      "Customer ဆီက ငွေလွှဲ Slip ရောက်လာတယ်။  \nAI က Transaction ID နဲ့ ငွေပမာဏကို OCR ဖတ်ပြီး စနစ်ထဲ ထည့်ပေးလိုက်တယ်။\n\nဒါနဲ့ ပစ္စည်းတန်းထုတ်ပေးလိုက်လို့ ရပြီလား?\n\nမရသေးပါဘူး။\n\nAI မြင်တာက ပုံထဲက စာလုံးနဲ့ ဂဏန်းတွေပါ။\n\nSlip အတုလား၊ Photoshop နဲ့ ပြင်ထားတာလား၊ ငွေလွှဲပြီး ချက်ချင်း Cancel လုပ်လိုက်တာလား ဆိုတာ AI က မသိနိုင်ပါဘူး။\n\nဒီလို Workflow မှာ AI ကို လုပ်ခိုင်းရမှာက—\n\nSlip ထဲက Transaction ID၊ အချိန်နဲ့ ပမာဏကို OCR ဖတ်ဖို့။  \nBank Statement / SMS Notification နဲ့ အချက်အလက် တိုက်ဆိုင်စစ်ဆေးပေးဖို့။  \nမကိုက်ညီတဲ့ အချက်တွေရှိရင် သတိပေးဖို့။\n\nဒါပေမယ့် ပစ္စည်းတကယ်ထုတ်ပေးမယ့် နောက်ဆုံးအဆင့်မှာတော့—\n\nဘဏ်အကောင့်ထဲ ငွေတကယ်ဝင်မဝင်။  \nSlip စစ်မှန်မှု ရှိမရှိ။\n\nဒီအချက်တွေကို လူက ကိုယ်တိုင်စစ်ဆေးပြီးမှ Order ကို \"Paid\" အတည်ပြုပေးရပါမယ်။\n\nယုံကြည်ရတဲ့ စနစ်တစ်ခုမှာ AI ရဲ့ အခန်းကဏ္ဍက Data Extraction အထိသာ ဖြစ်ပြီး Financial Verification နဲ့ Safe Dispatch ကို လူကပဲ ဆုံးဖြတ်အတည်ပြုရပါမယ်။\n\nAI ကို Data ဖတ်ခိုင်းပါ။  \nပစ္စည်းထုတ်ပေးတဲ့ အတည်ပြုချက်ကို လူက စစ်ပါ။\n\nသင့်လုပ်ငန်းမှာ Payment စစ်ဆေးတဲ့အခါ AI ကို ဘယ်အပိုင်းအထိပဲ သုံးသင့်တယ်လို့ ထင်ပါသလဲ?"
  },
  {
    id: "ex-t5",
    workspaceId: "ws-fyf",
    topic: "AI News Reality vs Hype: Grok Bot & Multi-Agent Teams",
    content:
      "xAI ကနေ Grok Bot ဆိုပြီး Multi-Bot (AI အဖွဲ့လိုက် အလုပ်လုပ်တဲ့ စနစ်) အသစ်တစ်ခု ထုတ်လိုက်တဲ့အခါ လုပ်ငန်းရှင်တွေ ကြားထဲမှာ စိတ်ဝင်စားမှုတွေ အရမ်းများလာပါတယ်။\n\nစျေးကွက်ကြော်ငြာတွေမှာတော့ \"ဒီ Bot ကို သုံးလိုက်ရင် စာရေးတာရော၊ Data စစ်တာရော၊ Coding ရေးတာရော အကုန် လူမလိုဘဲ အလိုအလျောက် ပြီးသွားတော့မယ်\" လို့ ပြောနေကြပါတယ်။\n\nဒါပေမဲ့ တကယ့် လက်တွေ့ လုပ်ငန်းခွင်မှာ ဒီလို ဟုတ်ပါသလား?\n\nအရင်ဆုံး Grok Bot ဆိုတာ ဘာလဲ အရင်ရှင်းပြပါရစေ—\nအရင်တုန်းက Chatbot တွေက လူတစ်ယောက်တည်းကို မေးခွန်းအကုန် သွားမေးသလို ဖြစ်နေတာပါ။ အခု Multi-Bot စနစ်ကတော့ ရုံးတစ်ရုံးမှာ \"စာရင်းကိုင် လက်ထောက်လေး\"၊ \"စာရေးပေးတဲ့ လက်ထောက်လေး\"၊ \"အမှားစစ်ပေးတဲ့ လက်ထောက်လေး\" ဆိုပြီး Bot လေးတွေကို အလုပ်ခွဲပေးထားတဲ့ ပုံစံမျိုး ဖြစ်ပါတယ်။\n\nဒါဆိုရင် အကုန် အဆင်ပြေသွားပြီလား? မပြေသေးပါဘူး။\n\nတကယ့် လက်တွေ့မှာ ကြုံရမည့် အချက် (၃) ချက် ရှိပါတယ်:\n\n၁။ Bot အချင်းချင်း စကားပြောပြီး အလုပ်ရှုပ်နေတာ (Infinite Loop Risk):\nBot တစ်ခုနဲ့တစ်ခု တာဝန်လွှဲရင်း အဖြေမထွက်ဘဲ စက်ဝိုင်းပတ်နေတတ်ပါတယ်။ ဒါက လုပ်ငန်းအတွက် အချိန်ကုန်စေသလို API စရိတ်တွေ မလိုအပ်ဘဲ အဆမတန် ကုန်ကျသွားနိုင်ပါတယ်။\n\n၂။ လုပ်ငန်းရဲ့ အရေးကြီး စည်းမျဉ်းကို နားမလည်တာ (Context Blindness):\nBot က အလုပ်မြန်ပေမယ့် ကိုယ့်လုပ်ငန်းရဲ့ ဖောက်သည်ဆက်ဆံရေး၊ စျေးနှုန်းအလျှော့အတင်းနဲ့ အမြတ်ငွေ Context တွေကို အပြည့်အဝ နားမလည်နိုင်ပါဘူး။\n\n၃။ ခွင့်ပြုချက်မရှိဘဲ လုပ်ဆောင်မိတာ (Permission Risk):\nBot တွေကို အချင်းချင်း လွတ်လပ်စွာ ဆုံးဖြတ်ခွင့် ပေးလိုက်ရင် လူမသိဘဲ အီးမေးလ်တွေ မှားပို့တာ၊ စာရင်းတွေ မှားပြင်မိတာ ဖြစ်လာနိုင်ပါတယ်။\n\n💡 FYF Systems Rule:\n\"နည်းပညာအသစ်တွေ ထွက်လာတိုင်း ချက်ချင်း မတပ်ဆင်ပါနဲ့။ Bot တွေကို အလုပ်ကူခိုင်းလို့ ရပေမယ့် ငွေကြေးသုံးစွဲမှု ကန့်သတ်ချက် (Spending Limit) နဲ့ နောက်ဆုံး အတည်ပြုခွင့်ကိုတော့ လူကပဲ တင်းတင်းကျပ်ကျပ် ကိုင်ထားပါ။\"\n\nသင့်လုပ်ငန်းအတွက် စိတ်ကြိုက် AI Workflow စနစ် တည်ဆောက်လိုပါက Page Messenger သို့ 'WORKFLOW' ဟု ပို့ပြီး တိုင်ပင်ဆွေးနွေးနိုင်ပါသည်\n\n#FYFAI #AIAgents #BusinessAutomation #HumanInTheLoop"
  },
  {
    id: "ex-3",
    workspaceId: "ws-agency",
    topic: "Launch offer",
    content: "သင့်လုပ်ငန်းကို online မှာပိုမြင်သာအောင် content plan နဲ့ ads setup ကို တစ်နေရာတည်းကနေ စနစ်တကျကူညီပေးနေပါတယ်။"
  }
];

export const mediaAssets: MediaAsset[] = [
  {
    id: "media-fyf-chart",
    workspaceId: "ws-fyf",
    draftId: "draft-risk",
    name: "risk-plan-chart.png",
    type: "image",
    size: "demo asset"
  },
  {
    id: "media-agency-recap",
    workspaceId: "ws-agency",
    draftId: "draft-failed",
    name: "campaign-recap.png",
    type: "image",
    size: "demo asset"
  }
];

export const seedDrafts: Draft[] = [
  {
    id: "draft-risk",
    workspaceId: "ws-fyf",
    topic: "AI Agent workflow planning for beginners",
    content:
      "AI Agent တွေကို စနစ်တကျလေ့လာချင်သူတွေအတွက် ဒီနေ့ topic က prompt engineering နဲ့ risk management ပါ။ Human approval flow နဲ့ တည်ဆောက်ရင် decision ပိုကောင်းလာနိုင်ပါတယ်။",
    status: "needs_review",
    riskLevel: "review",
    score: 82,
    version: 2,
    updatedAt: "Today, 9:30 AM"
  },
  {
    id: "draft-scheduled",
    workspaceId: "ws-fyf",
    topic: "AI Workflow basics",
    content:
      "AI content workflow ကို စတင်ချင်ရင် prompt structure ကိုနားလည်ဖို့၊ audience ကိုသိဖို့၊ ယုံကြည်မှုတည်ဆောက်ဖို့ လိုပါတယ်။",
    status: "scheduled",
    riskLevel: "safe",
    score: 91,
    scheduledFor: "Tomorrow, 7:00 PM",
    version: 1,
    updatedAt: "Today, 11:15 AM"
  },
  {
    id: "draft-published",
    workspaceId: "ws-fyf",
    topic: "AI Mindset",
    content:
      "AI tools တွေကို စည်းကမ်းတကျ အသုံးချနိုင်ဖို့ အရင်လေ့ကျင့်ပါ။",
    status: "published",
    riskLevel: "safe",
    score: 94,
    version: 3,
    updatedAt: "Yesterday, 8:00 PM"
  },
  {
    id: "draft-failed",
    workspaceId: "ws-agency",
    topic: "Client campaign recap",
    content: "ဒီအပတ် campaign result ကို ပြန်ကြည့်ပြီး next step အတွက် content angle အသစ်တွေ စမ်းကြည့်ပါမယ်။",
    status: "failed",
    riskLevel: "safe",
    score: 76,
    version: 1,
    updatedAt: "Today, 10:05 AM"
  }
];

export const promptVersions: PromptVersion[] = [
  {
    id: "prompt-fyf-1",
    workspaceId: "ws-fyf",
    name: "Mock Gemini Burmese draft prompt",
    prompt: "Use FYF AI's Burmese style examples, avoid hype, and return only Burmese Facebook copy.",
    createdAt: "Today, 9:20 AM"
  },
  {
    id: "prompt-agency-1",
    workspaceId: "ws-agency",
    name: "Agency demo prompt",
    prompt: "Create service-education social copy for a local digital agency demo workspace.",
    createdAt: "Today, 9:00 AM"
  }
];

export const integrationSettings: IntegrationSetting[] = [
  {
    workspaceId: "ws-fyf",
    provider: "gemini",
    status: "demo",
    maskedSecret: "demo••••24",
    lastChecked: "2 min ago",
    config: { model: "gemini-demo-burmese", demoMode: true }
  },
  {
    workspaceId: "ws-fyf",
    provider: "sheets",
    status: "healthy",
    maskedSecret: "masked••••tone",
    lastChecked: "6 min ago",
    config: { sheetUrl: "https://docs.google.com/spreadsheets/d/demo-fyf-tone", sheetId: "demo-fyf-tone", range: "Posts!A:B" }
  },
  {
    workspaceId: "ws-fyf",
    provider: "facebook",
    status: "demo",
    maskedSecret: "masked••••page",
    lastChecked: "4 min ago",
    config: { pageId: "fyf-forex-demo-page", permissions: ["pages_read_engagement", "pages_manage_posts"], mockPublishReady: true }
  },
  {
    workspaceId: "ws-agency",
    provider: "gemini",
    status: "demo",
    maskedSecret: "demo••••88",
    lastChecked: "1 min ago",
    config: { model: "gemini-demo-burmese", demoMode: true }
  },
  {
    workspaceId: "ws-agency",
    provider: "sheets",
    status: "demo",
    maskedSecret: "masked••••demo",
    lastChecked: "8 min ago",
    config: { sheetUrl: "https://docs.google.com/spreadsheets/d/demo-agency-tone", sheetId: "demo-agency-tone", range: "Posts!A:C" }
  },
  {
    workspaceId: "ws-agency",
    provider: "facebook",
    status: "needs_setup",
    maskedSecret: "not configured",
    lastChecked: "Never",
    config: { pageId: "", permissions: ["pages_read_engagement"], mockPublishReady: false }
  }
];

export const integrationLogs: IntegrationLog[] = [
  {
    id: "integration-log-fyf-1",
    workspaceId: "ws-fyf",
    provider: "facebook",
    action: "mock publish ready check",
    status: "demo",
    createdAt: "Today, 10:15 AM"
  },
  {
    id: "integration-log-agency-1",
    workspaceId: "ws-agency",
    provider: "facebook",
    action: "setup incomplete",
    status: "failed",
    createdAt: "Today, 9:48 AM"
  }
];

export const auditEvents: AuditEvent[] = [
  { id: "audit-1", workspaceId: "ws-fyf", actor: "Demo User", action: "risk review run", detail: "Draft checked for guaranteed-profit language.", createdAt: "Today, 10:21 AM" },
  { id: "audit-2", workspaceId: "ws-fyf", actor: "Demo User", action: "AI fix applied", detail: "Safer rewrite created for Burmese draft.", createdAt: "Today, 10:09 AM" },
  { id: "audit-3", workspaceId: "ws-fyf", actor: "System", action: "mock publish completed", detail: "Fake Facebook post ID fb_demo_2048 returned.", createdAt: "Yesterday, 8:04 PM" },
  { id: "audit-4", workspaceId: "ws-agency", actor: "System", action: "publish blocked", detail: "Facebook Page integration not configured.", createdAt: "Today, 9:48 AM" }
];

export const draftVersions: DraftVersion[] = [
  {
    id: "version-1",
    workspaceId: "ws-fyf",
    draftId: "draft-risk",
    version: 1,
    content: "Forex beginner တွေအတွက် risk management ကို အခြေခံကနေ ပြန်ရှင်းပြမယ်။",
    reason: "Initial mock Gemini output",
    createdAt: "Today, 9:21 AM"
  },
  {
    id: "version-2",
    workspaceId: "ws-fyf",
    draftId: "draft-risk",
    version: 2,
    content: seedDrafts[0].content,
    reason: "Manual editor polish",
    createdAt: "Today, 9:30 AM"
  },
  {
    id: "version-3",
    workspaceId: "ws-fyf",
    draftId: "draft-published",
    version: 3,
    content: seedDrafts[2].content,
    reason: "Approved publish copy",
    createdAt: "Yesterday, 7:55 PM"
  }
];

export const publishJobs: PublishJob[] = [
  {
    id: "publish-seed-1",
    workspaceId: "ws-fyf",
    draftId: "draft-published",
    status: "published",
    idempotencyKey: "ws-fyf:draft-published:3",
    fakePostId: "fb_demo_2048",
    createdAt: "Yesterday, 8:04 PM"
  },
  {
    id: "publish-seed-2",
    workspaceId: "ws-agency",
    draftId: "draft-failed",
    status: "failed",
    idempotencyKey: "ws-agency:draft-failed:1",
    reason: "Mock media handoff failed before publish.",
    createdAt: "Today, 10:07 AM"
  }
];

export const scheduleJobs: ScheduleJob[] = [
  {
    id: "schedule-seed-1",
    workspaceId: "ws-fyf",
    draftId: "draft-scheduled",
    scheduledFor: "Tomorrow, 7:00 PM",
    status: "scheduled"
  }
];

export const analyticsSnapshots: AnalyticsSnapshot[] = [
  { id: "analytics-1", workspaceId: "ws-fyf", draftId: "draft-published", reactions: 186, comments: 24, shares: 11, reach: 3420, capturedAt: "Today, 8:00 AM" },
  { id: "analytics-2", workspaceId: "ws-fyf", draftId: "draft-scheduled", reactions: 0, comments: 0, shares: 0, reach: 0, capturedAt: "Pending" },
  { id: "analytics-3", workspaceId: "ws-agency", draftId: "draft-failed", reactions: 42, comments: 6, shares: 2, reach: 820, capturedAt: "Today, 10:30 AM" }
];

export const contentIdeas: ContentIdea[] = [
  { id: "idea-1", workspaceId: "ws-fyf", title: "Risk management checklist for new traders", source: "manual", status: "new" },
  { id: "idea-2", workspaceId: "ws-fyf", title: "Why guaranteed profit claims are dangerous", source: "mock_ai", status: "new" },
  { id: "idea-3", workspaceId: "ws-agency", title: "July client content sprint", source: "calendar", status: "used" }
];

export const onboardingChecklistItems: OnboardingChecklistItem[] = [
  {
    id: "onboarding-fyf-1",
    workspaceId: "ws-fyf",
    label: "Create workspace",
    completed: true,
    detail: "FYF AI Trading demo workspace is ready."
  },
  {
    id: "onboarding-fyf-2",
    workspaceId: "ws-fyf",
    label: "Load Sheets style memory",
    completed: true,
    detail: "Mock Google Sheets examples are available for tone matching."
  },
  {
    id: "onboarding-fyf-3",
    workspaceId: "ws-fyf",
    label: "Configure Facebook Page",
    completed: true,
    detail: "Demo Facebook Page settings are masked and mock-publish ready."
  },
  {
    id: "onboarding-fyf-4",
    workspaceId: "ws-fyf",
    label: "Generate first draft",
    completed: true,
    detail: "A Burmese draft is waiting in the Pipeline."
  },
  {
    id: "onboarding-fyf-5",
    workspaceId: "ws-fyf",
    label: "Review Risk Guard",
    completed: true,
    detail: "Risk Guard is enabled for AI claims and marketing wording."
  },
  {
    id: "onboarding-agency-1",
    workspaceId: "ws-agency",
    label: "Create workspace",
    completed: true,
    detail: "Agency demo workspace is ready."
  },
  {
    id: "onboarding-agency-2",
    workspaceId: "ws-agency",
    label: "Load Sheets style memory",
    completed: true,
    detail: "Agency style examples are loaded from mock Sheets."
  },
  {
    id: "onboarding-agency-3",
    workspaceId: "ws-agency",
    label: "Configure Facebook Page",
    completed: false,
    detail: "Add a Page ID and required permissions before live publish."
  },
  {
    id: "onboarding-agency-4",
    workspaceId: "ws-agency",
    label: "Recover failed job",
    completed: false,
    detail: "A failed campaign draft is waiting in the Recovery Queue."
  },
  {
    id: "onboarding-agency-5",
    workspaceId: "ws-agency",
    label: "Approve first draft",
    completed: false,
    detail: "Review and approve a safe draft before mock publishing."
  }
];

export const brandProfiles: BrandProfile[] = [
  {
    id: "brand-fyf",
    workspaceId: "ws-fyf",
    description: "Practical, practitioner-grounded Burmese AI agent & workflow education for SME business owners.",
    targetAudience: "Burmese SME business owners, creators, and team leads building reliable AI workflows.",
    toneRules: [
      "Calm, practitioner-grounded Burmese mentor voice",
      "Strict zero-jargon rule: replace developer terms with plain everyday SME business terms",
      "Dynamic length: 300-450 words for deep breakdowns, 180-250 words for checklists",
      "Clear human-in-the-loop decision boundaries",
      "No generic hype, fluff, or exaggerated claims",
      "Concrete operational scenarios over tool names",
      "Thought-provoking ending question for business owners"
    ],
    forbiddenPhrases: ["အမြတ် အာမခံ", "လုံးဝ မရှုံး", "အမြန်ချမ်းသာ", "100% automated", "easy money"],
    preferredCtas: [
      "သင့်လုပ်ငန်းအတွက် စိတ်ကြိုက် AI Workflow စနစ် တည်ဆောက်လိုပါက Page Messenger သို့ 'WORKFLOW' ဟု ပို့ပြီး တိုင်ပင်ဆွေးနွေးနိုင်ပါသည်",
      "သင့်လုပ်ငန်းမှာ ဘယ်လိုသုံးမလဲ comment မှာ ဆွေးနွေးပါ",
      "ဒီ Workflow ကို သင့်လုပ်ငန်းထဲ ထည့်သွင်းနိုင်ဖို့ Save လုပ်ထားပါ"
    ],
    voiceNotes: "Use natural Burmese spacing generously. Strictly avoid developer jargon (no Ingestion, LangGraph, State Machine, Maker/Checker, OCR Pipeline). Connect directly to everyday SME business operations. Establish explicit human verification gates."
  },
  {
    id: "brand-agency",
    workspaceId: "ws-agency",
    description: "Digital agency content for service education and campaign planning.",
    targetAudience: "Local business owners and client reviewers.",
    toneRules: ["Clear", "Service-focused", "Measured"],
    forbiddenPhrases: ["guaranteed result"],
    preferredCtas: ["Book a consultation", "Ask for a content plan"],
    voiceNotes: "Keep technical language inside Integrations or internal notes."
  }
];

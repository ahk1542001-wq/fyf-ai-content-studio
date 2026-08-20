export type RiskIssue = {
  code: string;
  severity: "review" | "blocked";
  phrase: string;
  explanation: string;
  saferRewrite: string;
};

const riskyPatterns: Array<Omit<RiskIssue, "phrase"> & { pattern: RegExp }> = [
  {
    code: "guaranteed_profit",
    severity: "blocked",
    pattern: /(guaranteed profit|အမြတ်\s*အာမခံ|လုံးဝ\s*မရှုံး|ရှုံးစရာမရှိ)/i,
    explanation: "Financial results cannot be guaranteed. This can mislead traders.",
    saferRewrite: "အမြတ်ကို အာမခံမပေးနိုင်ပေမယ့် risk control နဲ့ plan ရှိရင် decision ပိုကောင်းလာနိုင်ပါတယ်။"
  },
  {
    code: "unrealistic_income",
    severity: "blocked",
    pattern: /(တစ်ရက်.*သိန်း|မိနစ်.*ဝင်ငွေ|အမြန်ချမ်းသာ|easy money)/i,
    explanation: "Unrealistic income claims are unsafe for forex and affiliate content.",
    saferRewrite: "ရလဒ်က လူတိုင်းအတွက် မတူနိုင်ပါဘူး။ စနစ်တကျလေ့လာပြီး သင့်တော်တဲ့ risk နဲ့သာ စတင်ပါ။"
  },
  {
    code: "direct_financial_advice",
    severity: "review",
    pattern: /(buy now|sell now|အခုဝယ်|အခုရောင်း|ဒီ trade ကိုဝင်)/i,
    explanation: "Direct buy/sell advice should be avoided without proper context.",
    saferRewrite: "Market setup ကို ကိုယ်တိုင်ပြန်စစ်ပြီး risk ကို သင့်တော်အောင်တွက်ချက်ပါ။"
  },
  {
    code: "high_pressure",
    severity: "review",
    pattern: /(နောက်ကျမနေနဲ့|အခုချက်ချင်း|last chance|limited only)/i,
    explanation: "High-pressure wording can push users into risky financial decisions.",
    saferRewrite: "စိတ်ဝင်စားရင် အသေးစိတ်ကို အေးအေးဆေးဆေးလေ့လာပြီးမှ ဆုံးဖြတ်ပါ။"
  },
  {
    code: "misleading_claim",
    severity: "review",
    pattern: /(100%\s*(accurate|win rate|success)|တိကျ\s*100%|အနိုင်ရ\s*နှုန်း\s*(100%|၁၀၀%)|သေချာပေါက်\s*(နိုင်|ရ)|signal\s*တိကျ|always\s*win)/i,
    explanation: "Accuracy or certainty claims can mislead traders about market uncertainty.",
    saferRewrite: "Market result က မသေချာနိုင်တာကြောင့် signal တစ်ခုတည်းကို မယုံဘဲ setup, risk, journal ကိုပါစစ်ပါ။"
  },
  {
    code: "unsafe_trading_promise",
    severity: "blocked",
    pattern: /(risk[-\s]?free|no risk|zero risk|အန္တရာယ်\s*မရှိ|ဘေးကင်း\s*တယ်|copy\s*my\s*trade|ငါ့\s*trade\s*ကို\s*ကူး|double\s*(your|the)\s*money|ငွေ\s*နှစ်ဆ|get\s*rich\s*quick|passive\s*income\s*guaranteed|500x|1000x)/i,
    explanation: "Risk-free or copy-trade promises are unsafe for forex and affiliate audiences.",
    saferRewrite: "Trading မှာ risk အမြဲရှိနိုင်တာကြောင့် ကိုယ်တိုင်လေ့လာပြီး risk plan နဲ့သာ ဆုံးဖြတ်ပါ။"
  }
];

export function runRiskGuard(content: string): RiskIssue[] {
  return riskyPatterns.flatMap((item) => {
    const match = content.match(item.pattern);
    if (!match) return [];
    return [
      {
        code: item.code,
        severity: item.severity,
        phrase: match[0],
        explanation: item.explanation,
        saferRewrite: item.saferRewrite
      }
    ];
  });
}

export function applySafeRewrite(content: string, issues: RiskIssue[]) {
  return issues.reduce((next, issue) => {
    if (!issue.phrase) return next;
    return next.replace(issue.phrase, issue.saferRewrite);
  }, content);
}

type RewriteContext = {
  description?: string;
  targetAudience?: string;
  preferredCtas?: string[];
};

export function buildSafeContextRewrite(topic: string, content: string, issues: RiskIssue[], context?: RewriteContext) {
  if (!issues.some((issue) => issue.severity === "blocked")) {
    return applySafeRewrite(content, issues);
  }

  const audience = context?.targetAudience || "Myanmar beginners";
  const project = context?.description || "AI workflow ကို စနစ်တကျစတင်ချင်သူတွေအတွက်";
  const cta = context?.preferredCtas?.[0] || "သိချင်တာရှိရင် comment မှာ မေးလို့ရပါတယ်။";

  return [
    `${topic} အကြောင်းကို ${audience} အတွက် ${project} ဆိုတဲ့ context နဲ့ ပြန်ရှင်းပြချင်ပါတယ်။`,
    "",
    "✅ ရလဒ်ကို အာမခံလို့မရပါ။ အံ့ဖွယ်ရလဒ်နဲ့ အာမခံချက် claim တွေမသုံးပါ",
    "✅ ကိုယ့် user data, goal, workflow နဲ့ကိုက်အောင် သေးသေးလေးစမ်းပြီးမှ တိုးချဲ့ပါ",
    "✅ Tool နာမည်ထက် process, approval, review step ကိုရှင်းအောင်ထားပါ",
    "",
    cta
  ].join("\n");
}

export const buildSafeForexRewrite = buildSafeContextRewrite;

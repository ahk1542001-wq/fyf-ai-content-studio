import { runRiskGuard } from "@/integrations/riskGuard";

export function scoreContentBreakdown(content: string) {
  const issues = runRiskGuard(content);
  const burmeseClarity = /[\u1000-\u109F]/.test(content) ? 92 : 20;
  const hookStrength = content.length > 80 ? 78 : 48;
  const ctaStrength = /(comment|မေး|ဆက်သွယ်|inbox|\?|လဲ|လား|ဘယ်လို|ဘယ်ဟာ|အကြံပြု)/i.test(content) ? 86 : 44;
  const brandVoice = /(risk|plan|စနစ်တကျ|လေ့လာ|ဆုံးဖြတ်|discipline|လူက|တာဝန်|စစ်|approve|human|boundary)/i.test(content) ? 88 : 52;
  const riskReadiness = issues.some((issue) => issue.severity === "blocked") ? 15 : issues.length ? 62 : 94;
  const overall = Math.round((burmeseClarity + hookStrength + ctaStrength + brandVoice + riskReadiness) / 5);

  return {
    overall,
    burmeseClarity,
    hookStrength,
    ctaStrength,
    brandVoice,
    riskReadiness
  };
}

export function scoreContent(content: string) {
  return scoreContentBreakdown(content).overall;
}

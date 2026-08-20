import { describe, expect, it } from "vitest";
import { scoreContent, scoreContentBreakdown } from "@/backend/contentQuality";

describe("content quality score", () => {
  it("returns the full UI-ready score breakdown and keeps overall consistent", () => {
    const content =
      "Risk ကို စနစ်တကျတွက်ပြီး plan နဲ့လေ့လာပါ။ Trading မှာ discipline ရှိရင် decision ပိုကောင်းလာနိုင်ပါတယ်။ သိချင်တာရှိရင် comment မှာ မေးနိုင်ပါတယ်။";

    const breakdown = scoreContentBreakdown(content);

    expect(Object.keys(breakdown).sort()).toEqual([
      "brandVoice",
      "burmeseClarity",
      "ctaStrength",
      "hookStrength",
      "overall",
      "riskReadiness"
    ]);
    expect(scoreContent(content)).toBe(breakdown.overall);
    expect(breakdown.overall).toBe(Math.round(
      (breakdown.brandVoice + breakdown.burmeseClarity + breakdown.ctaStrength + breakdown.hookStrength + breakdown.riskReadiness) / 5
    ));
  });

  it("scores a safe Burmese FYF AI-style draft as publish-ready", () => {
    const breakdown = scoreContentBreakdown(
      "Trading စတင်သူတွေအတွက် risk ကို စနစ်တကျတွက်ပြီး plan နဲ့လေ့လာတာက အရေးကြီးပါတယ်။ " +
        "အမြတ်ထက် discipline နဲ့ decision process ကိုအရင်တည်ဆောက်ပါ။ သိချင်တာရှိရင် comment မှာ မေးနိုင်ပါတယ်။"
    );

    expect(breakdown.burmeseClarity).toBeGreaterThanOrEqual(90);
    expect(breakdown.hookStrength).toBeGreaterThanOrEqual(75);
    expect(breakdown.ctaStrength).toBeGreaterThanOrEqual(80);
    expect(breakdown.brandVoice).toBeGreaterThanOrEqual(85);
    expect(breakdown.riskReadiness).toBeGreaterThanOrEqual(90);
    expect(breakdown.overall).toBeGreaterThanOrEqual(85);
  });

  it("penalizes non-Burmese generic copy without FYF AI style or CTA", () => {
    const breakdown = scoreContentBreakdown("Markets move fast. Learn more.");

    expect(scoreContentBreakdown("မင်္ဂလာပါ").burmeseClarity).toBe(92);
    expect(scoreContentBreakdown("Hello world").burmeseClarity).toBe(20);
    expect(breakdown.burmeseClarity).toBeLessThan(50);
    expect(breakdown.hookStrength).toBeLessThan(60);
    expect(breakdown.ctaStrength).toBeLessThan(60);
    expect(breakdown.brandVoice).toBeLessThan(60);
    expect(breakdown.overall).toBeLessThan(60);
  });

  it("uses the V1 length boundary for hook strength", () => {
    expect(scoreContentBreakdown("a".repeat(80)).hookStrength).toBe(48);
    expect(scoreContentBreakdown("a".repeat(81)).hookStrength).toBe(78);
  });

  it("drops publish readiness sharply for blocked forex claims", () => {
    const breakdown = scoreContentBreakdown(
      "ဒီ strategy က အမြတ် အာမခံပါတယ်။ Risk plan မလိုဘဲ comment မှာ မေးနိုင်ပါတယ်။"
    );

    expect(breakdown.riskReadiness).toBe(15);
    expect(breakdown.riskReadiness).toBeLessThan(30);
    expect(breakdown.overall).toBeLessThan(75);
  });

  it("marks review-risk pressure wording lower than safe content but not as blocked", () => {
    const breakdown = scoreContentBreakdown(
      "Risk ကို plan နဲ့ကြည့်ပါ။ ဒါပေမယ့် အခုချက်ချင်း ဆုံးဖြတ်ဖို့ မလိုပါဘူး။ comment မှာ မေးနိုင်ပါတယ်။"
    );

    expect(breakdown.riskReadiness).toBe(62);
    expect(breakdown.riskReadiness).toBeGreaterThan(30);
    expect(breakdown.riskReadiness).toBeLessThan(80);
  });

  it("recognizes Burmese question and inbox calls to action", () => {
    expect(scoreContentBreakdown("Risk plan အကြောင်း မေးချင်တာရှိရင် မေးနိုင်ပါတယ်။").ctaStrength).toBeGreaterThan(80);
    expect(scoreContentBreakdown("Risk plan အကြောင်း inbox မှာ ဆက်သွယ်နိုင်ပါတယ်။").ctaStrength).toBeGreaterThan(80);
  });

  it("recognizes FYF AI brand voice keywords", () => {
    expect(scoreContentBreakdown("discipline ရှိအောင် လေ့လာပါ။").brandVoice).toBe(88);
    expect(scoreContentBreakdown("အကြောင်းအရာကို ကြည့်ပါ။").brandVoice).toBe(52);
  });

  it("recognizes human-in-the-loop boundary keywords", () => {
    expect(scoreContentBreakdown("လူက စစ်ဆေးပြီးမှ ဆုံးဖြတ်ပါ။").brandVoice).toBe(88);
    expect(scoreContentBreakdown("ဆုံးဖြတ်ချက်နဲ့ တာဝန်ကို လူကပဲ ယူရမယ်။").brandVoice).toBe(88);
    expect(scoreContentBreakdown("Human approval boundary ထားရှိပါ။").brandVoice).toBe(88);
    expect(scoreContentBreakdown("Order မထုတ်ခင် အရင် စစ် ပါ။").brandVoice).toBe(88);
  });

  it("recognizes Burmese reflective question ending patterns", () => {
    expect(scoreContentBreakdown("အခုလုပ်နေတဲ့ Weekly Report မှာ လူက manually စုနေရတဲ့ Step က ဘယ်ဟာလဲ?").ctaStrength).toBe(86);
    expect(scoreContentBreakdown("သင့်လုပ်ငန်းမှာ AI ကို လုံးဝမအပ်သင့်သေးတဲ့ Final Action တစ်ခုက ဘာဖြစ်မလဲ?").ctaStrength).toBe(86);
    expect(scoreContentBreakdown("ဒီ workflow ကို သင့်လုပ်ငန်းမှာ ဘယ်လို အသုံးပြုနိုင်မလဲ?").ctaStrength).toBe(86);
    expect(scoreContentBreakdown("AI ရဲ့ recommendation ကို လက်ခံသင့်ပါသလား?").ctaStrength).toBe(86);
    expect(scoreContentBreakdown("ဘယ်အပိုင်းမှာ အကြံပြု ချက် ယူသင့်သလဲ?").ctaStrength).toBe(86);
  });

  it("scores all 4 verified FYF reference posts (T1-T4) as publish-ready (>=85)", async () => {
    const { styleExamples } = await import("@/database/demo-data/demoData");
    const fyfExamples = styleExamples.filter((e) => e.workspaceId === "ws-fyf");

    expect(fyfExamples.length).toBeGreaterThanOrEqual(4);

    for (const example of fyfExamples) {
      const breakdown = scoreContentBreakdown(example.content);
      expect(breakdown.burmeseClarity).toBeGreaterThanOrEqual(90);
      expect(breakdown.hookStrength).toBeGreaterThanOrEqual(75);
      expect(breakdown.ctaStrength).toBeGreaterThanOrEqual(80);
      expect(breakdown.brandVoice).toBeGreaterThanOrEqual(85);
      expect(breakdown.riskReadiness).toBeGreaterThanOrEqual(90);
      expect(breakdown.overall).toBeGreaterThanOrEqual(85);
    }
  });
});

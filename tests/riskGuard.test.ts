import { describe, expect, it } from "vitest";
import { applySafeRewrite, buildSafeForexRewrite, runRiskGuard } from "@/integrations/riskGuard";

describe("Risk Guard", () => {
  it("blocks guaranteed profit claims in Burmese", () => {
    const issues = runRiskGuard("ဒီ strategy က အမြတ် အာမခံ ရပါတယ်");
    expect(issues[0]?.code).toBe("guaranteed_profit");
    expect(issues[0]?.severity).toBe("blocked");
  });

  it("suggests and applies safer rewrites", () => {
    const text = "အခုချက်ချင်း join လုပ်ရင် easy money ရမယ်";
    const issues = runRiskGuard(text);
    const fixed = applySafeRewrite(text, issues);
    expect(fixed).not.toContain("easy money");
    expect(fixed).toContain("စနစ်တကျ");
  });

  it("flags direct advice and high-pressure phrases for review", () => {
    const issues = runRiskGuard("ဒီ trade ကိုဝင်ပြီး နောက်ကျမနေနဲ့။");
    expect(issues).toMatchObject([
      { code: "direct_financial_advice", severity: "review" },
      { code: "high_pressure", severity: "review" }
    ]);
  });

  it("flags misleading accuracy and certainty claims for review", () => {
    const issues = runRiskGuard("ကျွန်တော်တို့ signal တိကျ 100% ဖြစ်လို့ သေချာပေါက် နိုင်ပါတယ်။");

    expect(issues.map((issue) => issue.code)).toContain("misleading_claim");
    expect(issues.find((issue) => issue.code === "misleading_claim")).toMatchObject({
      severity: "review",
      explanation: expect.stringContaining("Accuracy or certainty")
    });
    expect(runRiskGuard("ဒီ strategy က အနိုင်ရနှုန်း ၁၀၀% ရှိပါတယ်။")[0]).toMatchObject({
      code: "misleading_claim",
      severity: "review"
    });
  });

  it("blocks unsafe risk-free and copy-trade promises", () => {
    const issues = runRiskGuard("ဒီ account က no risk ဖြစ်ပြီး copy my trade လုပ်ရင် safe ဖြစ်ပါတယ်။");

    expect(issues.find((issue) => issue.code === "unsafe_trading_promise")).toMatchObject({
      severity: "blocked",
      saferRewrite: expect.stringContaining("Trading မှာ risk အမြဲရှိ")
    });
    expect(runRiskGuard("Get rich quick နဲ့ passive income guaranteed ဖြစ်ပြီး ငွေ နှစ်ဆ ရမယ်။").some((issue) => issue.code === "unsafe_trading_promise")).toBe(true);
  });

  it("does not flag safe risk education wording as risk-free promises", () => {
    const issues = runRiskGuard("Trading မှာ risk ရှိပါတယ်။ Stop loss နဲ့ risk management ကို စနစ်တကျလေ့လာပါ။");

    expect(issues).toHaveLength(0);
  });

  it("builds a clean safe rewrite for blocked forex claims", () => {
    const text = "ဒီ strategy က အမြတ် အာမခံ ရပြီး လုံးဝ မရှုံးပါဘူး။ copy my trade လုပ်လို့ရပါတယ်။";
    const fixed = buildSafeForexRewrite("Beginner forex plan", text, runRiskGuard(text));
    expect(runRiskGuard(fixed).some((issue) => issue.severity === "blocked")).toBe(false);
    expect(fixed).toContain("ရလဒ်ကို အာမခံလို့မရပါ");
  });
});

export function mockAnalyticsSnapshot(seed: number, pillar?: string) {
  const baseViews = 5200 + seed * 450;
  const baseReach = 2400 + seed * 211;
  const baseReactions = 120 + seed * 17;
  const baseComments = 12 + seed * 3;
  const baseShares = 8 + seed * 2;
  const baseClicks = 85 + seed * 12;

  // Realistic performance variation based on FYF Content Pillars
  let multiplier = {
    views: 1.0,
    reach: 1.0,
    reactions: 1.0,
    shares: 1.0,
    clicks: 1.0
  };

  const normalizedPillar = pillar?.toLowerCase().replace(/[\s_-]+/g, "_");

  if (normalizedPillar === "operational_failure_risks" || normalizedPillar === "system_story") {
    // High reach & viral shares due to real-world risk resonance (+42% reach, 2.5x shares)
    multiplier = { views: 1.35, reach: 1.42, reactions: 1.25, shares: 2.5, clicks: 1.3 };
  } else if (normalizedPillar === "human_control_checkpoints") {
    // High engagement and clicks on human boundaries & verification gates
    multiplier = { views: 1.2, reach: 1.25, reactions: 1.35, shares: 1.8, clicks: 1.5 };
  } else if (normalizedPillar === "knowledge_frameworks" || normalizedPillar === "framework_mascot") {
    // High shares for bookmarking architectures & state machine workflows
    multiplier = { views: 1.15, reach: 1.18, reactions: 1.1, shares: 2.1, clicks: 1.4 };
  } else if (normalizedPillar === "ai_news_analysis" || normalizedPillar === "fact_analysis") {
    // High views and reactions on timely AI analysis
    multiplier = { views: 1.4, reach: 1.3, reactions: 1.3, shares: 1.4, clicks: 1.2 };
  }

  const views = Math.round(baseViews * multiplier.views);
  const reach = Math.round(baseReach * multiplier.reach);
  const reactions = Math.round(baseReactions * multiplier.reactions);
  const comments = Math.round(baseComments * multiplier.reactions);
  const shares = Math.round(baseShares * multiplier.shares);
  const clicks = Math.round(baseClicks * multiplier.clicks);

  const engagementRate = reach > 0 ? Number((((reactions + comments + shares + clicks) / reach) * 100).toFixed(2)) : 0;

  return {
    views,
    reach,
    reactions,
    comments,
    shares,
    clicks,
    pillar,
    engagementRate
  };
}

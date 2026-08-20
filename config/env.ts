export const featureFlags = {
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE !== "false",
  realPublishingEnabled: false
};

export const publicConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "FYF AI Content Studio"
};

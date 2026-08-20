export interface DemoApiEnvironment {
  nodeEnv?: string;
  flag?: string;
}

export function isDemoApiPath(pathname: string): boolean {
  return pathname === "/api/workspaces" || pathname.startsWith("/api/workspaces/");
}

export function isDemoApiEnabled(
  env: DemoApiEnvironment = {
    nodeEnv: process.env.NODE_ENV,
    flag: process.env.FYF_DEMO_API_ENABLED,
  }
): boolean {
  return env.nodeEnv !== "production" || env.flag === "true";
}

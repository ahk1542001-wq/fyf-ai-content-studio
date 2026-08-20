import type { IntegrationConfig, IntegrationProvider, IntegrationSetting } from "@/backend/types";

export function maskSecret(rawValue: string) {
  if (!rawValue.trim()) return "not configured";
  const compact = rawValue.replace(/\s+/g, "");
  if (compact.length <= 6) return "••••••";
  return `${compact.slice(0, 4)}••••${compact.slice(-2)}`;
}

export function saveIntegrationSecret(setting: IntegrationSetting, rawValue: string): IntegrationSetting {
  return {
    ...setting,
    status: rawValue.trim() ? "demo" : "needs_setup",
    maskedSecret: maskSecret(rawValue),
    lastChecked: "Just now"
  };
}

const stringKeys = new Set<keyof IntegrationConfig>(["model", "sheetUrl", "sheetId", "range", "pageId"]);
const booleanKeys = new Set<keyof IntegrationConfig>(["demoMode", "mockPublishReady"]);
const stringArrayKeys = new Set<keyof IntegrationConfig>(["permissions"]);
const urlKeys = new Set<keyof IntegrationConfig>(["sheetUrl"]);
const sensitiveQueryFragments = ["token", "secret", "key", "password", "auth", "signature", "sig"];

export function defaultIntegrationConfig(provider: IntegrationProvider): IntegrationConfig {
  if (provider === "gemini") return { model: "gemini-demo-burmese", demoMode: true };
  if (provider === "sheets") return { sheetId: "demo-fyf-tone", range: "Posts!A:B" };
  if (provider === "facebook") return { pageId: "fyf-forex-demo-page", permissions: ["pages_read_engagement", "pages_manage_posts"], mockPublishReady: true };
  return {};
}

function isSensitiveQueryParam(name: string) {
  const normalized = name.toLowerCase();
  return sensitiveQueryFragments.some((fragment) => normalized.includes(fragment));
}

export function redactSensitiveUrlQueryParams(rawValue: string) {
  const trimmed = rawValue.trim();
  const [withoutHash, hash = ""] = trimmed.split("#", 2);
  const [base, query = ""] = withoutHash.split("?", 2);
  if (!query) return trimmed;

  const params = new URLSearchParams(query);
  let redacted = false;
  for (const key of Array.from(params.keys())) {
    if (isSensitiveQueryParam(key)) {
      params.set(key, "redacted");
      redacted = true;
    }
  }

  if (!redacted) return trimmed;
  const suffix = hash ? `#${hash}` : "";
  return `${base}?${params.toString()}${suffix}`;
}

export function sanitizeIntegrationConfigPatch(rawValue: unknown): Partial<IntegrationConfig> {
  if (!rawValue || typeof rawValue !== "object" || Array.isArray(rawValue)) return {};

  return Object.entries(rawValue as Record<string, unknown>).reduce<Partial<IntegrationConfig>>((config, [key, value]) => {
    const typedKey = key as keyof IntegrationConfig;
    if (stringKeys.has(typedKey) && typeof value === "string") {
      const sanitizedValue = urlKeys.has(typedKey) ? redactSensitiveUrlQueryParams(value) : value.trim();
      return { ...config, [typedKey]: sanitizedValue };
    }
    if (booleanKeys.has(typedKey) && typeof value === "boolean") {
      return { ...config, [typedKey]: value };
    }
    if (stringArrayKeys.has(typedKey) && Array.isArray(value)) {
      return { ...config, [typedKey]: value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean) };
    }
    return config;
  }, {});
}

export function saveIntegrationConfig(setting: IntegrationSetting, configPatch: Partial<IntegrationConfig>): IntegrationSetting {
  const mergedConfig = { ...defaultIntegrationConfig(setting.provider), ...(setting.config ?? {}), ...configPatch };
  return {
    ...setting,
    config: mergedConfig,
    lastChecked: "Just now"
  };
}

export function saveIntegrationSettings(
  setting: IntegrationSetting,
  values: { secret?: string; config?: Partial<IntegrationConfig> }
): IntegrationSetting {
  const withConfig = values.config ? saveIntegrationConfig(setting, values.config) : setting;
  if (typeof values.secret !== "string") return { ...withConfig, lastChecked: "Just now" };
  return saveIntegrationSecret(withConfig, values.secret);
}

export type IntegrationChecklistItem = {
  label: string;
  ok: boolean;
  detail: string;
};

export type IntegrationConnectionResult = {
  provider: IntegrationProvider;
  ok: boolean;
  status: IntegrationSetting["status"] | "demo-ready" | "not-configured";
  message: string;
  checkedAt: string;
  checklist: IntegrationChecklistItem[];
};

export function testIntegrationConnection(setting: IntegrationSetting): IntegrationConnectionResult {
  const checklist = buildIntegrationChecklist(setting);
  const ok = checklist.every((item) => item.ok);

  if (!ok || setting.status === "needs_setup") {
    return {
      provider: setting.provider,
      ok: false,
      status: "needs_setup",
      message: `${setting.provider} setup is incomplete. Review the readiness checklist before enabling the demo path.`,
      checkedAt: "Just now",
      checklist
    };
  }

  return {
    provider: setting.provider,
    ok: true,
    status: setting.status,
    message: `${setting.provider} mock connection passed in demo mode. No live external request was sent.`,
    checkedAt: "Just now",
    checklist
  };
}

function hasMaskedSecret(setting: IntegrationSetting) {
  return Boolean(setting.maskedSecret && setting.maskedSecret !== "not configured");
}

function buildIntegrationChecklist(setting: IntegrationSetting): IntegrationChecklistItem[] {
  const config = { ...defaultIntegrationConfig(setting.provider), ...(setting.config ?? {}) };
  const credential = {
    label: "Masked credential",
    ok: hasMaskedSecret(setting),
    detail: hasMaskedSecret(setting) ? "A masked demo value is stored." : "Paste a demo placeholder to keep raw secrets out of the app."
  };

  if (setting.provider === "gemini") {
    return [
      credential,
      {
        label: "Burmese model",
        ok: Boolean(config.model),
        detail: config.model ? `Drafting model set to ${config.model}.` : "Choose the Gemini model used for Burmese draft generation."
      },
      {
        label: "Demo mode",
        ok: config.demoMode === true,
        detail: config.demoMode ? "Live model calls stay disabled in this demo." : "Enable demo mode before running mock generation."
      }
    ];
  }

  if (setting.provider === "sheets") {
    return [
      credential,
      {
        label: "Sheet source",
        ok: Boolean(config.sheetUrl || config.sheetId),
        detail: config.sheetUrl || config.sheetId ? "Tone memory source is configured." : "Add the Google Sheet URL or ID for few-shot examples."
      },
      {
        label: "Example range",
        ok: Boolean(config.range),
        detail: config.range ? `Few-shot range: ${config.range}.` : "Add a range such as Posts!A:B."
      }
    ];
  }

  if (setting.provider === "facebook") {
    const permissions = config.permissions ?? [];
    return [
      credential,
      {
        label: "Page ID",
        ok: Boolean(config.pageId),
        detail: config.pageId ? `Target page: ${config.pageId}.` : "Add the Facebook Page ID for mock publishing."
      },
      {
        label: "Publish permission",
        ok: permissions.includes("pages_manage_posts"),
        detail: permissions.includes("pages_manage_posts") ? "pages_manage_posts is present." : "Add pages_manage_posts before publishing."
      },
      {
        label: "Mock publish gate",
        ok: config.mockPublishReady === true,
        detail: config.mockPublishReady ? "Approved drafts can use the mock publish path." : "Enable the mock publish gate after page setup."
      }
    ];
  }

  throw new Error(`Unsupported integration provider: ${setting.provider}`);
}

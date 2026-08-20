import { okJson, readJsonObject, routeError, textField } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";
import { sanitizeIntegrationConfigPatch, saveIntegrationSettings } from "@/backend/integrationSettings";
import type { IntegrationProvider } from "@/backend/types";

const providers = new Set<IntegrationProvider>(["gemini", "sheets", "facebook"]);

function providerField(value: string): IntegrationProvider {
  if (!providers.has(value as IntegrationProvider)) throw new Error("Integration provider is required");
  return value as IntegrationProvider;
}

export async function GET(_request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const repository = getDemoRepository();
  try {
    return okJson({
      settings: repository.listIntegrationSettings(workspaceId)
    });
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const repository = getDemoRepository();
  try {
    const body = await readJsonObject(request);
    const provider = providerField(textField(body, "provider"));
    const current = repository.getIntegrationSetting(workspaceId, provider);
    const config = sanitizeIntegrationConfigPatch(body.config);
    const setting = repository.upsertIntegrationSetting(
      saveIntegrationSettings(current, {
        secret: typeof body.secret === "string" ? body.secret : undefined,
        config: Object.keys(config).length ? config : undefined
      })
    );
    repository.addAuditEvent({
      id: `audit-${Date.now()}`,
      workspaceId,
      actor: "Demo API",
      action: "integration setting changed",
      detail: `${provider} demo integration settings saved without returning raw secrets.`,
      createdAt: "Just now"
    });

    return okJson({ ok: true, setting, auditEvents: repository.listAuditEvents(workspaceId) });
  } catch (error) {
    return routeError(error);
  }
}

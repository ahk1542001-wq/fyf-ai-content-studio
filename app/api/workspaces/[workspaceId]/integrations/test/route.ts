import { okJson, readJsonObject, routeError, textField } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";
import { testIntegrationConnection } from "@/backend/integrationSettings";
import type { IntegrationProvider } from "@/backend/types";

const providers = new Set<IntegrationProvider>(["gemini", "sheets", "facebook"]);

function providerField(value: string): IntegrationProvider {
  if (!providers.has(value as IntegrationProvider)) throw new Error("Integration provider is required");
  return value as IntegrationProvider;
}

export async function POST(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const repository = getDemoRepository();
  try {
    const body = await readJsonObject(request);
    const provider = providerField(textField(body, "provider"));
    const result = testIntegrationConnection(repository.getIntegrationSetting(workspaceId, provider));
    repository.addIntegrationLog({
      id: `integration-log-${Date.now()}`,
      workspaceId,
      provider,
      action: "connection test run",
      status: result.ok ? "demo" : "failed",
      createdAt: "Just now"
    });
    repository.addAuditEvent({
      id: `audit-${Date.now()}`,
      workspaceId,
      actor: "Demo API",
      action: "connection test run",
      detail: result.message,
      createdAt: "Just now"
    });

    return okJson({ ok: result.ok, result, auditEvents: repository.listAuditEvents(workspaceId) });
  } catch (error) {
    return routeError(error);
  }
}

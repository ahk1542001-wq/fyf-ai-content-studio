import { okJson, readJsonObject, routeError, textField } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";
import { applyAiFix, type AiFixMode } from "@/backend/draftLifecycle";

const fixModes = new Set<AiFixMode>(["safer", "hook", "shorter", "professional", "emotional", "brand_style", "cta", "client_feedback", "custom"]);

export async function POST(request: Request, { params }: { params: Promise<{ workspaceId: string; draftId: string }> }) {
  const { workspaceId, draftId } = await params;
  const repository = getDemoRepository();
  try {
    const body = await readJsonObject(request);
    const requestedMode = textField(body, "mode", "safer") as AiFixMode;
    if (!fixModes.has(requestedMode)) throw new Error("AI Fix mode is required");
    const brandProfile = repository.getBrandProfile(workspaceId);
    const instruction = typeof body.instruction === "string" ? body.instruction : undefined;
    const result = applyAiFix(
      repository,
      workspaceId,
      draftId,
      {
        mode: requestedMode,
        content: textField(body, "content"),
        topic: textField(body, "topic"),
        instruction,
        brandProfile
      },
      { actor: "Client Reviewer" }
    );

    return okJson({
      ok: true,
      ...result,
      versions: repository.listDraftVersions(workspaceId, draftId),
      auditEvents: repository.listAuditEvents(workspaceId)
    });
  } catch (error) {
    return routeError(error);
  }
}

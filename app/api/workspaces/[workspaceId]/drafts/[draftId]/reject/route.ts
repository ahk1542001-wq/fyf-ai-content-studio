import { okJson, readJsonObject, routeError, textField } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";
import { rejectDraft } from "@/backend/draftLifecycle";

export async function POST(request: Request, { params }: { params: Promise<{ workspaceId: string; draftId: string }> }) {
  const { workspaceId, draftId } = await params;
  const repository = getDemoRepository();
  try {
    const body = await readJsonObject(request);
    const draft = rejectDraft(repository, workspaceId, draftId, { actor: "Demo API" }, textField(body, "reason", "Rejected during review"));
    return okJson({ ok: true, draft, auditEvents: repository.listAuditEvents(workspaceId) });
  } catch (error) {
    return routeError(error);
  }
}

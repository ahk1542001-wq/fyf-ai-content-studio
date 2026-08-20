import { okJson, readJsonObject, routeError, textField } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";
import { archiveDraft, saveDraftEdit } from "@/backend/draftLifecycle";

export async function GET(_request: Request, { params }: { params: Promise<{ workspaceId: string; draftId: string }> }) {
  const { workspaceId, draftId } = await params;
  const repository = getDemoRepository();
  try {
    return okJson({
      draft: repository.getDraft(workspaceId, draftId),
      versions: repository.listDraftVersions(workspaceId, draftId)
    });
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ workspaceId: string; draftId: string }> }) {
  const { workspaceId, draftId } = await params;
  const repository = getDemoRepository();
  try {
    const body = await readJsonObject(request);
    const draft = saveDraftEdit(repository, workspaceId, draftId, textField(body, "content"), { actor: "Demo API" });
    return okJson({
      ok: true,
      draft,
      versions: repository.listDraftVersions(workspaceId, draftId),
      auditEvents: repository.listAuditEvents(workspaceId)
    });
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ workspaceId: string; draftId: string }> }) {
  const { workspaceId, draftId } = await params;
  const repository = getDemoRepository();
  try {
    const draft = archiveDraft(repository, workspaceId, draftId, { actor: "Demo API" });
    return okJson({
      ok: true,
      draft,
      scheduleJobs: repository.listScheduleJobs(workspaceId),
      auditEvents: repository.listAuditEvents(workspaceId)
    });
  } catch (error) {
    return routeError(error);
  }
}

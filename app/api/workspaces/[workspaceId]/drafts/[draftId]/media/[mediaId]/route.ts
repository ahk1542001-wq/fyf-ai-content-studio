import { okJson, routeError } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";
import { removeDraftMedia } from "@/backend/draftLifecycle";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string; draftId: string; mediaId: string }> }
) {
  const { workspaceId, draftId, mediaId } = await params;
  const repository = getDemoRepository();
  try {
    const draft = removeDraftMedia(repository, workspaceId, draftId, mediaId, { actor: "Demo API" });
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

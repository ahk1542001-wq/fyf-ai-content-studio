import { okJson, routeError } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";
import { recoverDraft } from "@/backend/draftLifecycle";

export async function POST(_request: Request, { params }: { params: Promise<{ workspaceId: string; draftId: string }> }) {
  const { workspaceId, draftId } = await params;
  const repository = getDemoRepository();
  try {
    const draft = recoverDraft(repository, workspaceId, draftId, { actor: "Demo API" });
    return okJson({
      ok: true,
      draft,
      publishJobs: repository.listPublishJobs(workspaceId),
      scheduleJobs: repository.listScheduleJobs(workspaceId),
      auditEvents: repository.listAuditEvents(workspaceId)
    });
  } catch (error) {
    return routeError(error);
  }
}

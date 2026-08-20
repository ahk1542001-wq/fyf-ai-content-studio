import { okJson, readJsonObject, routeError, textField } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";
import { scheduleDraft } from "@/backend/draftLifecycle";

export async function POST(request: Request, { params }: { params: Promise<{ workspaceId: string; draftId: string }> }) {
  const { workspaceId, draftId } = await params;
  const repository = getDemoRepository();
  try {
    const body = await readJsonObject(request);
    const job = scheduleDraft(repository, workspaceId, draftId, textField(body, "scheduledFor"), { actor: "Demo API" });
    return okJson({
      ok: true,
      job,
      draft: repository.getDraft(workspaceId, draftId),
      scheduleJobs: repository.listScheduleJobs(workspaceId),
      auditEvents: repository.listAuditEvents(workspaceId)
    });
  } catch (error) {
    return routeError(error);
  }
}

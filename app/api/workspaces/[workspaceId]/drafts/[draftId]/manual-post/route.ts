import { okJson, readJsonObject, routeError, textField } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";
import { markManuallyPosted } from "@/backend/draftLifecycle";
import { runRiskGuard } from "@/integrations/riskGuard";

export async function POST(request: Request, { params }: { params: Promise<{ workspaceId: string; draftId: string }> }) {
  const { workspaceId, draftId } = await params;
  const repository = getDemoRepository();
  try {
    const body = await readJsonObject(request);
    const job = markManuallyPosted(repository, workspaceId, draftId, { actor: "Demo API" }, textField(body, "externalPostId"));
    if (job.status !== "published") {
      const draft = repository.getDraft(workspaceId, draftId);
      return Response.json(
        {
          ok: false,
          error: {
            code: "conflict",
            message: job.reason ?? "Manual post marking was blocked.",
            details: {
              draft,
              issues: runRiskGuard(draft.content),
              job
            }
          }
        },
        { status: 409 }
      );
    }
    return okJson({
      ok: true,
      job,
      draft: repository.getDraft(workspaceId, draftId),
      publishJobs: repository.listPublishJobs(workspaceId),
      scheduleJobs: repository.listScheduleJobs(workspaceId),
      auditEvents: repository.listAuditEvents(workspaceId)
    });
  } catch (error) {
    return routeError(error);
  }
}

import { okJson, routeError } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";

export async function GET(_request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const repository = getDemoRepository();
  try {
    return okJson({
      auditEvents: repository.listAuditEvents(workspaceId),
      publishJobs: repository.listPublishJobs(workspaceId),
      scheduleJobs: repository.listScheduleJobs(workspaceId)
    });
  } catch (error) {
    return routeError(error);
  }
}

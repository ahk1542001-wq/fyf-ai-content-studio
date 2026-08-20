import { okJson, routeError } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";

export async function GET(_request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const repository = getDemoRepository();
  try {
    const workspace = repository.getWorkspace(workspaceId);
    const settings = repository.listIntegrationSettings(workspaceId);
    const ready = settings.filter((setting) => setting.status === "healthy" || setting.status === "demo").length;
    const failedJobs = repository.listDrafts(workspaceId).filter((draft) => draft.status === "failed").length;
    const onboardingItems = repository.listOnboardingChecklistItems(workspaceId);
    const onboardingCompleted = onboardingItems.filter((item) => item.completed).length;

    return okJson({
      session: repository.getDemoSession(workspaceId),
      workspace: {
        id: workspace.id,
        name: workspace.name,
        demoMode: workspace.demoMode
      },
      integrations: {
        ready,
        total: settings.length,
        settings
      },
      queues: {
        failedJobs,
        scheduledJobs: repository.listScheduleJobs(workspaceId).filter((job) => job.status === "scheduled").length,
        publishJobs: repository.listPublishJobs(workspaceId).length
      },
      onboarding: {
        completed: onboardingCompleted,
        total: onboardingItems.length,
        items: onboardingItems
      }
    });
  } catch (error) {
    return routeError(error);
  }
}

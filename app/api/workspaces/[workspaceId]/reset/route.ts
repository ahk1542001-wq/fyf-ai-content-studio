import { okJson, routeError } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";

export async function POST(_request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const repository = getDemoRepository();
  try {
    repository.resetWorkspace(workspaceId, "Demo API");
    return okJson({
      ok: true,
      drafts: repository.listDrafts(workspaceId),
      auditEvents: repository.listAuditEvents(workspaceId),
      analytics: repository.listAnalytics(workspaceId),
      publishJobs: repository.listPublishJobs(workspaceId),
      scheduleJobs: repository.listScheduleJobs(workspaceId),
      ideas: repository.listIdeas(workspaceId),
      styleExamples: repository.listStyleExamples(workspaceId),
      mediaAssets: repository.listMediaAssets(workspaceId),
      promptVersions: repository.listPromptVersions(workspaceId),
      integrationLogs: repository.listIntegrationLogs(workspaceId),
      onboardingChecklistItems: repository.listOnboardingChecklistItems(workspaceId),
      brandProfile: repository.getBrandProfile(workspaceId),
      settings: repository.listIntegrationSettings(workspaceId)
    });
  } catch (error) {
    return routeError(error);
  }
}

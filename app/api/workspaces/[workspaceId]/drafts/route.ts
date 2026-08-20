import { okJson, readJsonObject, routeError, textField } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";
import { generateDraft, generateLiveDraft } from "@/backend/draftLifecycle";

export async function GET(_request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const repository = getDemoRepository();
  try {
    return okJson({
      session: repository.getDemoSession(workspaceId),
      workspace: repository.getWorkspace(workspaceId),
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
      brandProfile: repository.getBrandProfile(workspaceId)
    });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const repository = getDemoRepository();
  try {
    const body = await readJsonObject(request);
    const generator = process.env.FYF_DRAFT_GENERATOR === "live" ? generateLiveDraft : generateDraft;
    const result = await generator(
      repository,
      workspaceId,
      {
        topic: textField(body, "topic"),
        tone: textField(body, "tone", "Friendly"),
        length: textField(body, "length", "Medium"),
        angle: textField(body, "angle", "Education first"),
        audience: textField(body, "audience", "Myanmar beginners"),
        cta: textField(body, "cta", "comment မှာ မေးပါ"),
        mediaName: textField(body, "mediaName")
      },
      { actor: "Demo API" }
    );

    return okJson({
      ok: true,
      ...result,
      mediaAssets: repository.listMediaAssets(workspaceId),
      promptVersions: repository.listPromptVersions(workspaceId),
      auditEvents: repository.listAuditEvents(workspaceId)
    });
  } catch (error) {
    return routeError(error);
  }
}

import { okJson, routeError } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";
import { generateTopicRecommendations } from "@/backend/topicEngine";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const repository = getDemoRepository();

  try {
    // Validate workspace existence (throws if workspaceId is invalid)
    repository.getWorkspace(workspaceId);

    const topPillars = repository.getPillarPerformanceSummary(workspaceId);
    const recommendations = generateTopicRecommendations(workspaceId, repository);

    return okJson({
      ok: true,
      workspaceId,
      topPillars,
      recommendations
    });
  } catch (error) {
    return routeError(error);
  }
}

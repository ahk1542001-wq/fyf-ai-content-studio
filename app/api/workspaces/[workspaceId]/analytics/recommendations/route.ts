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
    repository.getWorkspace(workspaceId);
    const recommendations = generateTopicRecommendations(workspaceId, repository);

    return okJson({
      ok: true,
      workspaceId,
      recommendations,
    });
  } catch (error) {
    return routeError(error);
  }
}

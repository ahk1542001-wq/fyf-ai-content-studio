import { okJson, routeError } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";
import { publishDraft } from "@/backend/draftLifecycle";
import { runRiskGuard } from "@/integrations/riskGuard";

export async function POST(_request: Request, { params }: { params: Promise<{ workspaceId: string; draftId: string }> }) {
  const { workspaceId, draftId } = await params;
  const repository = getDemoRepository();
  try {
    const job = publishDraft(repository, workspaceId, draftId, { actor: "Demo API" });
    if (job.status !== "published") {
      const draft = repository.getDraft(workspaceId, draftId);
      return Response.json(
        {
          ok: false,
          error: {
            code: "conflict",
            message: job.reason ?? "Mock publish was blocked.",
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
    return okJson({ ok: true, job });
  } catch (error) {
    return routeError(error);
  }
}

import { okJson, routeError } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";
import { approveDraft } from "@/backend/draftLifecycle";

export async function POST(_request: Request, { params }: { params: Promise<{ workspaceId: string; draftId: string }> }) {
  const { workspaceId, draftId } = await params;
  const repository = getDemoRepository();
  try {
    const result = approveDraft(repository, workspaceId, draftId, { actor: "Demo API" });
    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "conflict",
            message: "Risk Guard blocked approval.",
            details: result
          }
        },
        { status: 409 }
      );
    }

    return okJson({ ok: true, draft: result.draft, issues: result.issues, auditEvents: repository.listAuditEvents(workspaceId) });
  } catch (error) {
    return routeError(error);
  }
}

import { okJson, readJsonObject, routeError, textField } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const repository = getDemoRepository();
    const workspace = repository.getWorkspace(workspaceId);
    return okJson({ workspace });
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const repository = getDemoRepository();
    const body = await readJsonObject(request);
    const existing = repository.getWorkspace(workspaceId);

    const pageName = textField(body, "pageName", existing.pageName).trim();

    const workspace = repository.updateWorkspace(workspaceId, {
      pageName
    });

    return okJson({ ok: true, workspace });
  } catch (error) {
    return routeError(error);
  }
}

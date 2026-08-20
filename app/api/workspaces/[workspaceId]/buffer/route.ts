import { okJson, readJsonObject, routeError, textField } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";
import { getWeeklyBufferState } from "@/backend/bufferEngine";
import { scheduleDraft } from "@/backend/draftLifecycle";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const repository = getDemoRepository();
  try {
    const buffer = getWeeklyBufferState(repository, workspaceId);
    return okJson({
      ok: true,
      buffer,
    });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const repository = getDemoRepository();
  try {
    const body = await readJsonObject(request);
    const draftId = textField(body, "draftId");
    const scheduledFor = textField(body, "scheduledFor");

    const job = scheduleDraft(repository, workspaceId, draftId, scheduledFor, {
      actor: "Weekly Buffer Planner",
    });

    const buffer = getWeeklyBufferState(repository, workspaceId);

    return okJson({
      ok: true,
      job,
      buffer,
    });
  } catch (error) {
    return routeError(error);
  }
}

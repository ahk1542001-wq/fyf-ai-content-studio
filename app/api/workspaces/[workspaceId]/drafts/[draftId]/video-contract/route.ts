import { okJson, routeError } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";
import { buildApprovedVideoContentContract, type VideoVoiceMode } from "@/backend/videoContract";

const voiceModes = new Set<VideoVoiceMode>(["victor", "ai", "dual"]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; draftId: string }> }
) {
  const { workspaceId, draftId } = await params;
  const repository = getDemoRepository();

  try {
    const workspace = repository.getWorkspace(workspaceId);
    const draft = repository.getDraft(workspaceId, draftId);
    const brandProfile = repository.getBrandProfile(workspaceId);
    const approval = repository
      .listAuditEvents(workspaceId)
      .find((event) => event.action === "approve clicked" && event.detail.includes(`draftId=${draftId}`));

    if (!approval) throw new Error("Approval record not found for video handoff");

    const requestedVoice = new URL(request.url).searchParams.get("voice") ?? "ai";
    if (!voiceModes.has(requestedVoice as VideoVoiceMode)) throw new Error("Voice mode must be victor, ai, or dual");

    const contract = buildApprovedVideoContentContract({
      workspace,
      draft,
      brandProfile,
      approvedBy: approval.actor,
      approvedAt: approval.createdAt,
      voiceMode: requestedVoice as VideoVoiceMode
    });

    return okJson({ contract });
  } catch (error) {
    return routeError(error);
  }
}

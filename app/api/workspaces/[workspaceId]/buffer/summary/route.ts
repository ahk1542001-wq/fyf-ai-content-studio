import { okJson, routeError } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";
import { generateSundayExecutiveSummary, getWeeklyBufferState } from "@/backend/bufferEngine";
import { persistGeneratedDraft } from "@/backend/draftLifecycle";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const repository = getDemoRepository();
  try {
    const summary = generateSundayExecutiveSummary(repository, workspaceId);

    const result = persistGeneratedDraft(
      repository,
      workspaceId,
      {
        topic: summary.topic,
        tone: "Friendly but disciplined",
        length: "Medium",
        angle: "Weekly 3-point executive summary of real AI SME automation takeaways",
        audience: "Myanmar SME owners and founders",
        cta: "သင့်လုပ်ငန်းအတွက် စိတ်ကြိုက် AI Workflow စနစ် တည်ဆောက်လိုပါက Page Messenger သို့ 'WORKFLOW' ဟု ပို့ပြီး တိုင်ပင်ဆွေးနွေးနိုင်ပါသည်",
        mediaName: "Photo post",
        pillar: "framework_education",
      },
      { actor: "Sunday Summary Engine" },
      summary.content,
      "Sunday Executive Summary generation",
      "Executive Summary Engine"
    );

    const buffer = getWeeklyBufferState(repository, workspaceId);

    return okJson({
      ok: true,
      draft: result.draft,
      summary,
      buffer,
    });
  } catch (error) {
    return routeError(error);
  }
}

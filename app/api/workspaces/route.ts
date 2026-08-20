import { okJson, readJsonObject, routeError, textField } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";

export async function GET() {
  const repository = getDemoRepository();
  try {
    const workspaces = repository.listWorkspaces();
    return okJson({
      workspaces
    });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  const repository = getDemoRepository();
  try {
    const body = await readJsonObject(request);
    const name = textField(body, "name", "").trim();
    const pageName = textField(body, "pageName", name).trim();
    const industry = textField(body, "industry", "General Business").trim();
    const targetAudience = textField(body, "targetAudience", "Customers and audience").trim();
    const brandDescription = textField(body, "brandDescription", "").trim();
    const riskSensitivity = (body.riskSensitivity === "strict" || body.riskSensitivity === "relaxed")
      ? body.riskSensitivity
      : "standard";

    if (!name) {
      return routeError(new Error("Workspace name is required"));
    }

    const { workspace, brandProfile } = repository.createWorkspace({
      name,
      pageName: pageName || name,
      industry,
      targetAudience,
      brandDescription,
      riskSensitivity
    });

    return okJson({
      ok: true,
      workspace,
      brandProfile
    }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}

import { randomUUID } from "node:crypto";

import { okJson, readJsonObject, routeError, textField } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const repository = getDemoRepository();

    return okJson({ styleExamples: repository.listStyleExamples(workspaceId) });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const repository = getDemoRepository();

    const body = await readJsonObject(request);

    const topic = textField(body, "topic").trim();
    if (!topic) throw new Error("Topic is required");

    const content = textField(body, "content").trim();
    if (!content) throw new Error("Content is required");

    const styleExample = {
      id: `style-${randomUUID()}`,
      workspaceId,
      topic,
      content
    };

    repository.addStyleExample(styleExample);

    return okJson({
      ok: true,
      styleExample,
      styleExamples: repository.listStyleExamples(workspaceId)
    });
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const repository = getDemoRepository();
    const url = new URL(request.url);
    const exampleId = url.searchParams.get("id");

    if (!exampleId) {
      throw new Error("id parameter is required");
    }

    const deletedStyleExample = repository.deleteStyleExample(workspaceId, exampleId);

    return okJson({
      ok: true,
      deletedStyleExample,
      styleExamples: repository.listStyleExamples(workspaceId)
    });
  } catch (error) {
    return routeError(error);
  }
}

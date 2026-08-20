import { errorJson, okJson, readJsonObject, routeError } from "@/backend/apiResponse";
import { getDemoRepository } from "@/backend/demoRepository";
import type { BrandProfile, BrandTonePersona } from "@/backend/types";

const BRAND_TONE_PERSONAS: BrandTonePersona[] = [
  "friendly_disciplined",
  "energetic_bold",
  "luxury_prestigious",
  "formal_technical"
];

const STRING_ARRAY_FIELDS = ["toneRules", "forbiddenPhrases", "preferredCtas"] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const repository = getDemoRepository();
  try {
    const profile = repository.getBrandProfile(workspaceId);
    return okJson({ ok: true, brandProfile: profile });
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const repository = getDemoRepository();
  try {
    const body = await readJsonObject(request);
    const existing = repository.getBrandProfile(workspaceId);

    const persona = body.tonePersona;
    if (persona !== undefined && (typeof persona !== "string" || !BRAND_TONE_PERSONAS.includes(persona as BrandTonePersona))) {
      return errorJson("bad_request", `tonePersona must be one of: ${BRAND_TONE_PERSONAS.join(", ")}`);
    }

    for (const field of STRING_ARRAY_FIELDS) {
      const value = body[field];
      if (value !== undefined && (!Array.isArray(value) || value.some((item) => typeof item !== "string"))) {
        return errorJson("bad_request", `${field} must be an array of strings`);
      }
    }

    const stringArray = (field: typeof STRING_ARRAY_FIELDS[number], fallback: string[]) => {
      const value = body[field];
      return value === undefined ? fallback : (value as string[]).map((item) => item.trim()).filter(Boolean);
    };

    const updatedProfile: BrandProfile = {
      ...existing,
      description: typeof body.description === "string" ? body.description.trim() : existing.description,
      targetAudience: typeof body.targetAudience === "string" ? body.targetAudience.trim() : existing.targetAudience,
      voiceNotes: typeof body.voiceNotes === "string" ? body.voiceNotes.trim() : existing.voiceNotes,
      tonePersona: persona === undefined ? existing.tonePersona : persona as BrandTonePersona,
      toneRules: stringArray("toneRules", existing.toneRules),
      forbiddenPhrases: stringArray("forbiddenPhrases", existing.forbiddenPhrases),
      preferredCtas: stringArray("preferredCtas", existing.preferredCtas),
      primaryColor: typeof body.primaryColor === "string" ? body.primaryColor.trim() : existing.primaryColor,
      secondaryColor: typeof body.secondaryColor === "string" ? body.secondaryColor.trim() : existing.secondaryColor,
      accentColor: typeof body.accentColor === "string" ? body.accentColor.trim() : existing.accentColor,
      backgroundColor: typeof body.backgroundColor === "string" ? body.backgroundColor.trim() : existing.backgroundColor,
      customCta: typeof body.customCta === "string" ? body.customCta.trim() : existing.customCta
    };

    const saved = repository.updateBrandProfile(updatedProfile);
    repository.addAuditEvent({
      id: `audit-${Date.now()}`,
      workspaceId,
      actor: "Brand Admin",
      action: "brand profile updated",
      detail: "Updated workspace brand profile rules, persona, and colors.",
      createdAt: "Just now"
    });

    return okJson({
      ok: true,
      brandProfile: saved,
      auditEvents: repository.listAuditEvents(workspaceId)
    });
  } catch (error) {
    return routeError(error);
  }
}

import type { BrandProfile, Draft, Workspace } from "@/backend/types";

export type VideoVoiceMode = "configured" | "ai" | "dual";

export type ApprovedVideoContentContract = {
  contractVersion: "fyf.video-content.v1";
  source: {
    product: "fyf-ai-content-studio";
    handoff: "approved-content-only";
  };
  workspace: {
    id: string;
    name: string;
    pageName: string;
  };
  content: {
    draftId: string;
    topic: string;
    script: string;
    language: "my";
    version: number;
  };
  brand: {
    profileId: string;
    description: string;
    targetAudience: string;
    toneRules: string[];
    forbiddenPhrases: string[];
    preferredCtas: string[];
    voiceNotes: string;
    colors: {
      primary?: string;
      secondary?: string;
      accent?: string;
      background?: string;
    };
  };
  voice: {
    mode: VideoVoiceMode;
  };
  approval: {
    status: "approved";
    approvedBy: string;
    approvedAt: string;
  };
};

export type BuildApprovedVideoContentContractInput = {
  workspace: Workspace;
  draft: Draft;
  brandProfile: BrandProfile;
  approvedBy: string;
  approvedAt: string;
  voiceMode: VideoVoiceMode;
};

function requiredText(value: string, field: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${field} is required`);
  return trimmed;
}

export function buildApprovedVideoContentContract(
  input: BuildApprovedVideoContentContractInput
): ApprovedVideoContentContract {
  const { workspace, draft, brandProfile } = input;
  if (draft.workspaceId !== workspace.id) throw new Error("Draft does not belong to workspace");
  if (brandProfile.workspaceId !== workspace.id) throw new Error("Brand profile does not belong to workspace");
  if (draft.status !== "approved") throw new Error("Draft must be approved before video handoff");

  return {
    contractVersion: "fyf.video-content.v1",
    source: {
      product: "fyf-ai-content-studio",
      handoff: "approved-content-only"
    },
    workspace: {
      id: workspace.id,
      name: requiredText(workspace.name, "Workspace name"),
      pageName: requiredText(workspace.pageName, "Page name")
    },
    content: {
      draftId: requiredText(draft.id, "Draft ID"),
      topic: requiredText(draft.topic, "Draft topic"),
      script: requiredText(draft.content, "Draft content"),
      language: "my",
      version: draft.version
    },
    brand: {
      profileId: requiredText(brandProfile.id, "Brand profile ID"),
      description: requiredText(brandProfile.description, "Brand description"),
      targetAudience: requiredText(brandProfile.targetAudience, "Brand target audience"),
      toneRules: [...brandProfile.toneRules],
      forbiddenPhrases: [...brandProfile.forbiddenPhrases],
      preferredCtas: [...brandProfile.preferredCtas],
      voiceNotes: requiredText(brandProfile.voiceNotes, "Brand voice notes"),
      colors: {
        primary: brandProfile.primaryColor,
        secondary: brandProfile.secondaryColor,
        accent: brandProfile.accentColor,
        background: brandProfile.backgroundColor
      }
    },
    voice: { mode: input.voiceMode },
    approval: {
      status: "approved",
      approvedBy: requiredText(input.approvedBy, "Approver"),
      approvedAt: requiredText(input.approvedAt, "Approval time")
    }
  };
}

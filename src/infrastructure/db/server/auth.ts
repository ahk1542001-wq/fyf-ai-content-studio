import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

export type WorkspaceRole = "owner" | "editor" | "viewer";

type AppUser = {
  id: string;
  email: string;
  full_name: string;
};

type Membership = {
  workspace_id: string;
  role: WorkspaceRole;
};

type AuthFailure = {
  response: NextResponse;
};

export type WorkspaceAuthContext = {
  authUser: User;
  appUser: AppUser;
  workspaceId: string;
  role: WorkspaceRole;
};

export function hashContent(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function isAuthFailure(result: WorkspaceAuthContext | AuthFailure): result is AuthFailure {
  return "response" in result;
}

export async function requireWorkspaceAccess(
  supabase: ReturnType<typeof import("@supabase/ssr").createServerClient>,
  allowedRoles: WorkspaceRole[] = ["owner", "editor", "viewer"]
): Promise<WorkspaceAuthContext | AuthFailure> {
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { response: jsonError("Authentication required", 401) };
  }

  const { data: appUser, error: userError } = await supabase
    .from("users")
    .select("id,email,full_name")
    .eq("auth_provider", "supabase")
    .eq("auth_subject", user.id)
    .single();

  if (userError || !appUser) {
    return { response: jsonError("User is not onboarded for FYF", 403) };
  }

  const typedAppUser = appUser as AppUser;

  const { data: memberships, error: membershipError } = await supabase
    .from("memberships")
    .select("workspace_id,role")
    .eq("user_id", typedAppUser.id)
    .in("role", allowedRoles)
    .order("created_at", { ascending: true })
    .limit(2);

  if (membershipError || !memberships || memberships.length === 0) {
    return { response: jsonError("Workspace access denied", 403) };
  }

  if (memberships.length > 1) {
    return { response: jsonError("Workspace selection required", 409) };
  }

  const typedMembership = memberships[0] as Membership;

  return {
    authUser: user,
    appUser: typedAppUser,
    workspaceId: typedMembership.workspace_id,
    role: typedMembership.role
  };
}

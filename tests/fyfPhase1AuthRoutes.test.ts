import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  graphInvoke: vi.fn()
}));

vi.mock("@/src/infrastructure/db/server/supabase", () => ({
  createClient: mocks.createClient
}));

vi.mock("@/src/agents/graph", () => ({
  fyfAgentGraph: {
    invoke: mocks.graphInvoke
  }
}));

type InsertCall = {
  table: string;
  payload: Record<string, unknown>;
};

type Scenario = {
  user?: { id: string; email?: string };
  appUser?: { id: string; email: string; full_name: string };
  membership?: { workspace_id: string; role: "owner" | "editor" | "viewer" };
  memberships?: Array<{ workspace_id: string; role: "owner" | "editor" | "viewer" }>;
  run?: Record<string, unknown>;
  artifact?: Record<string, unknown>;
  draftVersion?: Record<string, unknown>;
  inserts: InsertCall[];
  updates: InsertCall[];
};

class QueryBuilder {
  private filters: Record<string, unknown> = {};
  private allowedRoles: string[] = [];
  private payload?: Record<string, unknown>;
  private operation: "insert" | "update" | "select" = "select";

  constructor(private table: string, private scenario: Scenario) {}

  select() {
    return this;
  }

  eq(key: string, value: unknown) {
    this.filters[key] = value;
    return this;
  }

  in(_key: string, value: string[]) {
    this.allowedRoles = value;
    this.filters.__allowedRoles = value;
    return this;
  }

  order() {
    return this;
  }

  limit() {
    return this;
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.resolveArray().then(onfulfilled, onrejected);
  }

  private async resolveArray() {
    return resolveQuery(this.table, this.operation, this.filters, this.scenario, this.payload, true);
  }

  insert(payload: Record<string, unknown>) {
    this.operation = "insert";
    this.payload = payload;
    this.scenario.inserts.push({ table: this.table, payload });
    return this;
  }

  update(payload: Record<string, unknown>) {
    this.operation = "update";
    this.payload = payload;
    this.scenario.updates.push({ table: this.table, payload });
    return this;
  }

  async single() {
    return resolveQuery(this.table, this.operation, this.filters, this.scenario, this.payload);
  }

  async maybeSingle() {
    const result = await resolveQuery(this.table, this.operation, this.filters, this.scenario, this.payload);
    if (result.error) {
      return { data: null, error: null };
    }
    return result;
  }
}

function createSupabase(scenario: Scenario) {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: scenario.user ?? null },
        error: scenario.user ? null : { message: "missing user" }
      }))
    },
    from: vi.fn((table: string) => new QueryBuilder(table, scenario))
  };
}

function createScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    user: { id: "auth-user-1", email: "victor@example.com" },
    appUser: { id: "app-user-1", email: "victor@example.com", full_name: "Victor" },
    membership: { workspace_id: "ws-owner", role: "owner" },
    inserts: [],
    updates: [],
    ...overrides
  };
}

function matchesWorkspace(filters: Record<string, unknown>, row?: Record<string, unknown>) {
  if (!row) {
    return false;
  }
  return Object.entries(filters).every(([key, value]) => row[key] === value);
}

async function resolveQuery(
  table: string,
  operation: "insert" | "update" | "select",
  filters: Record<string, unknown>,
  scenario: Scenario,
  payload?: Record<string, unknown>,
  asArray = false
) {
  if (operation === "update") {
    return { data: payload ?? null, error: null };
  }

  if (operation === "insert") {
    if (table === "content_briefs") {
      return { data: { id: "brief-1", ...payload }, error: null };
    }
    if (table === "workflow_runs") {
      return { data: { id: "run-1", revision_count: 0, ...payload }, error: null };
    }
    if (table === "content_artifacts") {
      return { data: { id: "artifact-1", current_version: 1, ...payload }, error: null };
    }
    if (table === "draft_versions") {
      return { data: { id: "draft-version-1", version: 1, ...payload }, error: null };
    }
    return { data: payload ?? {}, error: null };
  }

  if (table === "users") {
    const match = scenario.appUser && filters.auth_subject === scenario.user?.id;
    return match ? { data: scenario.appUser, error: null } : notFound();
  }

  if (table === "memberships") {
    const allowedRoles = (filters.__allowedRoles as string[] | undefined) ?? ["owner", "editor", "viewer"];
    const memberships = scenario.memberships ?? (scenario.membership ? [scenario.membership] : []);
    const matches = memberships.filter(
      (membership) => filters.user_id === scenario.appUser?.id && allowedRoles.includes(membership.role)
    );
    if (asArray) {
      return { data: matches, error: null };
    }
    return matches[0] ? { data: matches[0], error: null } : notFound();
  }

  if (table === "workflow_runs") {
    return matchesWorkspace(filters, scenario.run) ? { data: scenario.run, error: null } : notFound();
  }

  if (table === "content_artifacts") {
    return matchesWorkspace(filters, scenario.artifact) ? { data: scenario.artifact, error: null } : notFound();
  }

  if (table === "draft_versions") {
    return matchesWorkspace(filters, scenario.draftVersion) ? { data: scenario.draftVersion, error: null } : notFound();
  }

  return notFound();
}

function notFound() {
  return { data: null, error: { message: "not found" } };
}

function request(path: string, init?: RequestInit) {
  return new Request(`http://localhost${path}`, init);
}

function params<T extends Record<string, string>>(value: T) {
  return { params: Promise.resolve(value) };
}

describe("FYF Phase 1 authenticated routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.graphInvoke.mockResolvedValue({
      brief: {
        topic: "Gold risk plan",
        businessGoal: "Educate",
        format: "facebook_post",
        tone: "calm"
      },
      draftContent: "Generated FYF draft",
      reviewFeedback: "",
      revisionCount: 0,
      status: "ready_for_human"
    });
  });

  it("returns 401 when generate is called without Supabase auth", async () => {
    const scenario = createScenario({ user: undefined });
    mocks.createClient.mockResolvedValue(createSupabase(scenario));
    const { POST } = await import("@/app/api/generate/route");

    const response = await POST(
      request("/api/generate", {
        method: "POST",
        body: JSON.stringify({ topic: "x", goal: "y", format: "facebook_post", tone: "calm" })
      })
    );

    expect(response.status).toBe(401);
  });

  it("returns 403 when the authenticated user has no workspace membership", async () => {
    const scenario = createScenario({ membership: undefined });
    mocks.createClient.mockResolvedValue(createSupabase(scenario));
    const { POST } = await import("@/app/api/generate/route");

    const response = await POST(
      request("/api/generate", {
        method: "POST",
        body: JSON.stringify({ topic: "x", goal: "y", format: "facebook_post", tone: "calm" })
      })
    );

    expect(response.status).toBe(403);
  });

  it("returns 403 when a viewer tries to generate content", async () => {
    const scenario = createScenario({ membership: { workspace_id: "ws-owner", role: "viewer" } });
    mocks.createClient.mockResolvedValue(createSupabase(scenario));
    const { POST } = await import("@/app/api/generate/route");

    const response = await POST(
      request("/api/generate", {
        method: "POST",
        body: JSON.stringify({ topic: "x", goal: "y", format: "facebook_post", tone: "calm" })
      })
    );

    expect(response.status).toBe(403);
  });

  it("returns 409 when more than one editable workspace is available", async () => {
    const scenario = createScenario({
      membership: undefined,
      memberships: [
        { workspace_id: "ws-owner", role: "owner" },
        { workspace_id: "ws-second", role: "editor" }
      ]
    });
    mocks.createClient.mockResolvedValue(createSupabase(scenario));
    const { POST } = await import("@/app/api/generate/route");

    const response = await POST(
      request("/api/generate", {
        method: "POST",
        body: JSON.stringify({ topic: "x", goal: "y", format: "facebook_post", tone: "calm" })
      })
    );

    expect(response.status).toBe(409);
  });

  it("creates generated content inside the owner workspace and records draft version metadata", async () => {
    const scenario = createScenario();
    mocks.createClient.mockResolvedValue(createSupabase(scenario));
    const { POST } = await import("@/app/api/generate/route");

    const response = await POST(
      request("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          topic: "Gold risk plan",
          goal: "Educate",
          format: "facebook_post",
          tone: "calm"
        })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.version).toBe(1);
    expect(body.data.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(scenario.inserts.find((call) => call.table === "content_briefs")?.payload.workspace_id).toBe("ws-owner");
    expect(scenario.inserts.find((call) => call.table === "draft_versions")?.payload.content_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("does not reveal a draft from another workspace", async () => {
    const scenario = createScenario({
      run: {
        id: "run-other",
        workspace_id: "ws-other",
        revision_count: 0,
        status: "NEEDS_HUMAN_REVIEW",
        content_briefs: { id: "brief-other", topic: "Other", business_goal: "Other", format: "facebook_post", angle: "calm" }
      }
    });
    mocks.createClient.mockResolvedValue(createSupabase(scenario));
    const { GET } = await import("@/app/api/drafts/[id]/route");

    const response = await GET(request("/api/drafts/run-other"), params({ id: "run-other" }));

    expect(response.status).toBe(404);
  });

  it("rejects stale approval attempts", async () => {
    const scenario = createScenario({
      run: { id: "run-1", workspace_id: "ws-owner", status: "NEEDS_HUMAN_REVIEW" },
      artifact: {
        id: "artifact-1",
        workspace_id: "ws-owner",
        workflow_run_id: "run-1",
        current_version: 2,
        content: "Current content"
      },
      draftVersion: {
        id: "draft-version-2",
        workspace_id: "ws-owner",
        artifact_id: "artifact-1",
        version: 2,
        content_hash: "current-hash"
      }
    });
    mocks.createClient.mockResolvedValue(createSupabase(scenario));
    const { POST } = await import("@/app/api/drafts/[id]/approve/route");

    const response = await POST(
      request("/api/drafts/run-1/approve", {
        method: "POST",
        body: JSON.stringify({ expectedVersion: 1, contentHash: "old-hash" })
      }),
      params({ id: "run-1" })
    );

    expect(response.status).toBe(409);
    expect(scenario.updates).toHaveLength(0);
  });

  it("does not approve when the draft version row is missing", async () => {
    const scenario = createScenario({
      run: { id: "run-1", workspace_id: "ws-owner", status: "NEEDS_HUMAN_REVIEW" },
      artifact: {
        id: "artifact-1",
        workspace_id: "ws-owner",
        workflow_run_id: "run-1",
        current_version: 1,
        content: "Current content"
      }
    });
    mocks.createClient.mockResolvedValue(createSupabase(scenario));
    const { POST } = await import("@/app/api/drafts/[id]/approve/route");

    const response = await POST(
      request("/api/drafts/run-1/approve", {
        method: "POST",
        body: JSON.stringify({ expectedVersion: 1 })
      }),
      params({ id: "run-1" })
    );

    expect(response.status).toBe(409);
    expect(scenario.updates).toHaveLength(0);
  });
});

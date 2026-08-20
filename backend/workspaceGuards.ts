export function assertWorkspaceAccess<T extends { workspaceId: string }>(record: T, workspaceId: string): T {
  if (record.workspaceId !== workspaceId) {
    throw new Error("Workspace isolation violation");
  }
  return record;
}

export function filterByWorkspace<T extends { workspaceId: string }>(records: T[], workspaceId: string): T[] {
  return records.filter((record) => record.workspaceId === workspaceId);
}

import { styleExamples } from "@/database/demo-data/demoData";

export function mockSheetsFetchExamples(workspaceId: string) {
  return styleExamples.filter((example) => example.workspaceId === workspaceId);
}

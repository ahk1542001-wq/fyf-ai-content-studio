import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = process.cwd();
const workspaceRoot = appRoot;

function readText(path: string) {
  return readFileSync(path, "utf8");
}

function walkFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stats = statSync(path);
    return stats.isDirectory() ? walkFiles(path) : [path];
  });
}

function parseEnvExample(content: string) {
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const [key, ...valueParts] = line.split("=");
        return [key, valueParts.join("=").replace(/^"|"$/g, "")];
      })
  );
}

describe("repository security hygiene", () => {
  it("keeps required local artifacts and secrets excluded from git", () => {
    const gitignorePath = join(workspaceRoot, ".gitignore");
    expect(existsSync(gitignorePath)).toBe(true);

    const gitignore = readText(gitignorePath);
    for (const pattern of [
      ".env",
      ".env.*",
      "!.env.example",
      "node_modules/",
      ".next/",
      "*.sqlite",
      "*.sqlite3",
      "*.db",
      "database/local/",
      ".agents/",
      "output/",
      "test-results/",
      "playwright-report/"
    ]) {
      expect(gitignore).toContain(pattern);
    }
  });

  it("keeps .env.example demo-only and free of real credential values", () => {
    const envExample = parseEnvExample(readText(join(appRoot, ".env.example")));

    expect(envExample.NEXT_PUBLIC_DEMO_MODE).toBe("true");
    expect(envExample.DATABASE_URL).toMatch(/^file:\.\/database\/local\//);
    expect(envExample.FYF_DEMO_DB_PATH).toMatch(/^\.\/database\/local\//);

    for (const key of [
      "GEMINI_API_KEY",
      "GOOGLE_SHEETS_CLIENT_EMAIL",
      "GOOGLE_SHEETS_PRIVATE_KEY",
      "FACEBOOK_PAGE_ACCESS_TOKEN"
    ]) {
      expect(envExample[key]).toBe("");
    }
  });

  it("does not hardcode live-looking credentials in runtime source files", () => {
    const runtimeDirs = ["app", "backend", "config", "database", "frontend", "integrations"];
    const runtimeFiles = runtimeDirs.flatMap((dir) =>
      walkFiles(join(appRoot, dir)).filter((path) => /\.(ts|tsx|sql|css)$/.test(path))
    );
    const liveSecretPattern = /(AIza[0-9A-Za-z_-]{20,}|sk-[0-9A-Za-z_-]{20,}|EA[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]+PRIVATE KEY-----)/;

    const offenders = runtimeFiles
      .map((path) => ({ path: relative(appRoot, path), content: readText(path) }))
      .filter(({ content }) => liveSecretPattern.test(content))
      .map(({ path }) => path);

    expect(offenders).toEqual([]);
  });

  it("keeps mock adapters free of live network calls", () => {
    const mockAdapterFiles = walkFiles(join(appRoot, "integrations")).filter((path) => /mock.*\.ts$/.test(path));
    const networkPattern = /\b(fetch|XMLHttpRequest|WebSocket|EventSource)\b|https:\/\/(generativelanguage|graph\.facebook|sheets\.googleapis|api\.telegram)\./;

    const offenders = mockAdapterFiles
      .map((path) => ({ path: relative(appRoot, path), content: readText(path) }))
      .filter(({ content }) => networkPattern.test(content))
      .map(({ path }) => path);

    expect(offenders).toEqual([]);
  });

  it("keeps product source free of legacy client-specific identifiers", () => {
    const productPaths = ["app", "backend", "config", "database", "docs", "frontend", "integrations", "src", ".env.example"];
    const productFiles = productPaths.flatMap((entry) => {
      const path = join(appRoot, entry);
      return statSync(path).isDirectory() ? walkFiles(path) : [path];
    });
    const offenders = productFiles
      .filter((path) => /\.(md|ts|tsx|sql|css|example)$/.test(path))
      .map((path) => ({ path: relative(appRoot, path), content: readText(path) }))
      .filter(({ content }) => /yeman/i.test(content))
      .map(({ path }) => path);

    expect(offenders).toEqual([]);
  });
});

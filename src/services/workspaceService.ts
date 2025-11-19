import { homedir } from "os";
import { join, relative, sep } from "path";
import { readdir } from "fs/promises";
import { pathExists, readJson, uriToPath, normalizePathForPlatform } from "../utils/fs";
import type { Workspace } from "../types";
import { exec as execCb } from "child_process";
import { promisify } from "util";

const exec = promisify(execCb);

// ----------------------------------------------
// TYPES
// ----------------------------------------------

interface VSCodeWorkspaceJSON {
  folder?: string;
  configURIPath?: string;
  configPath?: string;
  folderUri?: string;
  [key: string]: unknown;
}

// ----------------------------------------------
// STORAGE PATHS
// ----------------------------------------------

function getCandidateStoragePaths(): string[] {
  const home = homedir();
  const candidates: string[] = [];

  if (process.platform === "win32") {
    candidates.push(join(home, "AppData", "Roaming", "Code", "User", "workspaceStorage"));
    candidates.push(join(home, "AppData", "Roaming", "Code - Insiders", "User", "workspaceStorage"));
    candidates.push(join(home, "AppData", "Roaming", "VSCodium", "User", "workspaceStorage"));
  } else if (process.platform === "darwin") {
    candidates.push(join(home, "Library", "Application Support", "Code", "User", "workspaceStorage"));
    candidates.push(join(home, "Library", "Application Support", "Code - Insiders", "User", "workspaceStorage"));
    candidates.push(join(home, "Library", "Application Support", "VSCodium", "User", "workspaceStorage"));
  }

  return candidates;
}

export async function findWorkspaceStoragePath(): Promise<string | null> {
  const candidates = getCandidateStoragePaths();
  for (const p of candidates) {
    if (await pathExists(p)) return p;
  }
  return null;
}

// ----------------------------------------------
// READ WORKSPACES
// ----------------------------------------------

export async function loadWorkspaces(): Promise<Workspace[]> {
  const storagePath = await findWorkspaceStoragePath();
  if (!storagePath) return [];

  const entries = await readdir(storagePath);
  const workspaces: Workspace[] = [];

  for (const id of entries) {
    try {
      const workspaceJsonPath = join(storagePath, id, "workspace.json");
      const data = await readJson<VSCodeWorkspaceJSON>(workspaceJsonPath);
      if (!data) continue;

      const folderUri = data.folder || data.configURIPath || data.configPath || data.folderUri;

      if (!folderUri || typeof folderUri !== "string") continue;

      const rawPath = uriToPath(folderUri);
      const path = normalizePathForPlatform(rawPath);
      const parts = path.split(process.platform === "win32" ? "\\" : "/");
      const name = parts.at(-1) || path;

      workspaces.push({ id, name, path });
    } catch {
      continue;
    }
  }

  workspaces.sort((a, b) => a.name.localeCompare(b.name));
  return workspaces;
}

// ----------------------------------------------
// OPEN WORKSPACE
// ----------------------------------------------

export async function openWorkspaceCLI(pathToOpen: string): Promise<void> {
  try {
    await exec(`code "${pathToOpen}"`);
    return;
  } catch {
    if (process.platform === "darwin") {
      await exec(`open -a "Visual Studio Code" --args "${pathToOpen}"`);
      return;
    }
    throw new Error("Failed to open VS Code using CLI");
  }
}

// ----------------------------------------------
// SAFE HELPERS
// ----------------------------------------------

function sanitizeId(id: string): string | null {
  if (!id || id.includes("..") || id.includes("/") || id.includes("\\") || id.includes(":")) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null;
  return id;
}

function escapeDoubleQuotes(str: string) {
  return str.replace(/"/g, '\\"');
}

async function execShell(cmd: string): Promise<void> {
  try {
    await exec(cmd);
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }
}

function extractErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ----------------------------------------------
// DELETE WORKSPACE
// ----------------------------------------------

export async function deleteWorkspaceById(id: string): Promise<void> {
  const { rm } = await import("fs/promises");

  const storagePath = await findWorkspaceStoragePath();
  if (!storagePath) throw new Error("Workspace storage path not found");

  const safeId = sanitizeId(id);
  if (!safeId) throw new Error(`Invalid workspace id: ${id}`);

  const workspaceFolderPath = join(storagePath, safeId);

  const rel = relative(storagePath, workspaceFolderPath);
  if (!rel || rel.startsWith("..") || rel.startsWith(`..${sep}`)) {
    throw new Error("Refusing deletion: path escapes workspaceStorage");
  }

  if (!(await pathExists(workspaceFolderPath))) return;

  try {
    await rm(workspaceFolderPath, { recursive: true, force: true });
    return;
  } catch (err) {
    const primary = extractErrorMessage(err);

    if (process.platform === "win32") {
      try {
        await execShell(`cmd /c rd /s /q "${escapeDoubleQuotes(workspaceFolderPath)}"`);
        return;
      } catch (fallback) {
        throw new Error(`Failed to delete workspace: ${primary}. Fallback error: ${extractErrorMessage(fallback)}`);
      }
    }

    if (process.platform === "darwin") {
      try {
        await execShell(`rm -rf "${escapeDoubleQuotes(workspaceFolderPath)}"`);
        return;
      } catch (fallback) {
        throw new Error(`Failed to delete workspace: ${primary}. Fallback error: ${extractErrorMessage(fallback)}`);
      }
    }

    throw new Error(`Failed to delete workspace: ${primary}`);
  }
}

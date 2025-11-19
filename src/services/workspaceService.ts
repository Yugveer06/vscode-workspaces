import { homedir } from "os";
import { join, relative, sep } from "path";
import { readdir } from "fs/promises";
import { pathExists, readJson, uriToPath, normalizePathForPlatform } from "../utils/fs";
import type { Workspace } from "../types";

// ----------------------------------------------
// STORAGE PATHS
// ----------------------------------------------

/** Candidate storage locations for Windows and macOS only */
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
      const data = await readJson<any>(workspaceJsonPath);
      if (!data) continue;

      const folderUri = data.folder || data.configURIPath || data.configPath || data.folderUri;
      if (!folderUri) continue;

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
  const { exec } = await import("child_process");

  return new Promise((resolve, reject) => {
    exec(`code "${pathToOpen}"`, (err) => {
      if (!err) return resolve();

      if (process.platform === "darwin") {
        exec(`open -a "Visual Studio Code" --args "${pathToOpen}"`, (e) => (e ? reject(e) : resolve()));
      } else {
        reject(err);
      }
    });
  });
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

function execShell(cmd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const { exec } = require("child_process");
    exec(cmd, { windowsHide: true, maxBuffer: 1024 * 1024 * 10 }, (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
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

  // Protect from accidental deletion outside storage folder
  const rel = relative(storagePath, workspaceFolderPath);
  if (!rel || rel.startsWith("..") || rel.startsWith(`..${sep}`)) {
    throw new Error("Refusing deletion: path escapes workspaceStorage");
  }

  if (!(await pathExists(workspaceFolderPath))) {
    return; // already gone
  }

  // FIRST: Try native Node fs.rm
  try {
    await rm(workspaceFolderPath, { recursive: true, force: true });
    return;
  } catch (err) {
    const primary = extractErrorMessage(err);

    // SECOND: Windows fallback
    if (process.platform === "win32") {
      try {
        const esc = escapeDoubleQuotes(workspaceFolderPath);
        await execShell(`cmd /c rd /s /q "${esc}"`);
        return;
      } catch (err2) {
        const fallback = extractErrorMessage(err2);
        throw new Error(`Failed to delete workspace folder: ${primary}. Fallback error: ${fallback}`);
      }
    }

    // THIRD: macOS fallback
    if (process.platform === "darwin") {
      try {
        const esc = escapeDoubleQuotes(workspaceFolderPath);
        await execShell(`rm -rf "${esc}"`);
        return;
      } catch (err2) {
        const fallback = extractErrorMessage(err2);
        throw new Error(`Failed to delete workspace folder: ${primary}. Fallback error: ${fallback}`);
      }
    }

    // OTHERWISE
    throw new Error(`Failed to delete workspace folder: ${primary}`);
  }
}

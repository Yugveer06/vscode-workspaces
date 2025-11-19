import { access, readFile } from "fs/promises";
import { constants } from "fs";

/** Check whether a path exists */
export async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/** Safely read and parse JSON file; returns null on failure */
export async function readJson<T = unknown>(p: string): Promise<T | null> {
  try {
    const s = await readFile(p, "utf8");
    const parsed = JSON.parse(s) as unknown;
    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * Convert a file URI (file:///...) to a platform path.
 * Handles Windows (file:///C:/path) and POSIX paths.
 */
export function uriToPath(uri: string): string {
  try {
    // new URL works for well-formed file URIs
    const u = new URL(uri);
    let p = u.pathname;

    // On Windows the pathname begins with a leading slash:
    // "/C:/Users/..." so remove the leading slash.
    if (process.platform === "win32" && p.startsWith("/")) {
      p = p.slice(1);
    }

    return decodeURIComponent(p);
  } catch {
    // Fallback: strip file:// prefix if present
    if (uri.startsWith("file://")) {
      let p = uri.replace(/^file:\/\//, "");
      if (process.platform === "win32" && p.startsWith("/")) p = p.slice(1);
      return decodeURIComponent(p);
    }

    // Not a URI — assume it's already a path
    return uri;
  }
}

/** Normalize slashes based on the platform (Windows uses backslashes) */
export function normalizePathForPlatform(p: string): string {
  if (process.platform === "win32") return p.replace(/\//g, "\\");
  return p;
}

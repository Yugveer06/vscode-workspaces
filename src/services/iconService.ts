import { detectProjectType } from "./projectDetector";
import type { Workspace } from "../types";

export async function assignIconsToWorkspaces(list: Workspace[]): Promise<(Workspace & { icon: string })[]> {
  const out: (Workspace & { icon: string })[] = [];

  for (const w of list) {
    const detected = await detectProjectType(w.path);
    out.push({
      ...w,
      icon: detected?.icon ?? "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/code/code-original.svg",
    });
  }

  return out;
}

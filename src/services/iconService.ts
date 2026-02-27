import { Icon } from "@raycast/api";

import { detectProjectType } from "@services/projectDetector";

import type { Workspace } from "@/types";

interface WorkspaceWithIcon extends Workspace {
  icon: string;
  projectType?: string;
}

export async function assignIconsToWorkspaces(list: Workspace[]): Promise<WorkspaceWithIcon[]> {
  const out: WorkspaceWithIcon[] = [];

  for (const w of list) {
    const detected = await detectProjectType(w.path);
    out.push({
      ...w,
      icon: detected?.icon ?? Icon.Folder,
      projectType: detected?.id,
    });
  }

  return out;
}

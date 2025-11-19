import React, { useEffect, useState } from "react";
import { showToast, Toast, confirmAlert, Alert } from "@raycast/api";
import WorkspaceList from "./components/WorkspaceList";
import type { Workspace } from "./types";
import { loadWorkspaces, openWorkspaceCLI, deleteWorkspaceById } from "./services/workspaceService";
import { assignIconsToWorkspaces } from "./services/iconService";

export default function Command() {
  const [workspaces, setWorkspaces] = useState<(Workspace & { icon: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const list = await loadWorkspaces();
        const withIcons = await assignIconsToWorkspaces(list);
        if (!mounted) return;
        setWorkspaces(withIcons);

        if (!list.length) {
          await showToast({
            style: Toast.Style.Failure,
            title: "No workspaces found",
            message: "Could not find any VS Code workspaces",
          });
        }
      } catch (err) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Error loading workspaces",
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleOpen(w: Workspace & { icon: string }) {
    try {
      await openWorkspaceCLI(w.path);
      await showToast({ style: Toast.Style.Success, title: "Opening workspace", message: w.name });
    } catch (err) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to open workspace",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function handleDelete(w: Workspace & { icon: string }) {
    const confirmed = await confirmAlert({
      title: "Delete Workspace",
      message: `Are you sure you want to delete "${w.name}"? This will remove it from history.`,
      primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
    });

    if (!confirmed) return;

    try {
      await deleteWorkspaceById(w.id);
      setWorkspaces((prev) => prev.filter((x) => x.id !== w.id));
      await showToast({ style: Toast.Style.Success, title: "Workspace deleted", message: w.name });
    } catch (err) {
      // Provide a friendlier message if possible
      const msg = err instanceof Error ? err.message : String(err);
      await showToast({ style: Toast.Style.Failure, title: "Failed to delete workspace", message: msg });
    }
  }

  return <WorkspaceList workspaces={workspaces} isLoading={isLoading} onOpen={handleOpen} onDelete={handleDelete} />;
}

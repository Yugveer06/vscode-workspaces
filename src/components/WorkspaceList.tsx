import { Action, ActionPanel, Icon, Keyboard, List } from "@raycast/api";
import type { Workspace } from "../types";

type Item = Workspace & { icon: string };

type Props = {
  workspaces: Item[];
  isLoading: boolean;
  onOpen: (w: Item) => Promise<void>;
  onDelete: (w: Item) => Promise<void>;
};

export default function WorkspaceList({ workspaces, isLoading, onOpen, onDelete }: Props) {
  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search VS Code workspaces...">
      {workspaces.map((w) => (
        <List.Item
          key={w.id}
          title={w.name}
          icon={{ source: w.icon }}
          accessories={[{ text: w.path }]}
          actions={
            <ActionPanel>
              <Action title="Open in VS Code" icon={Icon.Code} onAction={async () => await onOpen(w)} />
              <Action.CopyToClipboard title="Copy Path" shortcut={Keyboard.Shortcut.Common.CopyPath} content={w.path} />
              <Action
                title="Delete Workspace"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                shortcut={Keyboard.Shortcut.Common.Remove}
                onAction={async () => {
                  try {
                    await onDelete(w);
                  } catch (err) {
                    console.error("Delete action failed:", err);
                  }
                }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

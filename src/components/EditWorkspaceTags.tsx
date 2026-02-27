import { Action, ActionPanel, Color, Form, Icon, Keyboard, List, showToast, Toast, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";

import { TAG_COLORS } from "@constants/tags";
import {
  getTagRegistry,
  getTags,
  addTagToWorkspace,
  removeTagFromWorkspace,
  createTag,
  type TagInfo,
} from "@services/storageService";
import { getTagColorValue } from "@utils/tags";
import { pluralize } from "@utils/text";

import type { WorkspaceWithMetadata } from "@/types";

interface Props {
  workspace: WorkspaceWithMetadata;
  onTagsUpdated: (workspaceId: string, tags: string[]) => void;
}

interface CreateAndAddTagFormProps {
  workspaceId: string;
  onTagCreatedAndAdded: (tagName: string) => void;
}

function CreateAndAddTagForm({ workspaceId, onTagCreatedAndAdded }: CreateAndAddTagFormProps) {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values: { name: string; color: string }) {
    const name = values.name.trim();
    if (!name) {
      await showToast({ style: Toast.Style.Failure, title: "Tag name is required" });
      return;
    }

    setIsLoading(true);
    try {
      await createTag(name, values.color || undefined);
      await addTagToWorkspace(workspaceId, name);
      await showToast({ style: Toast.Style.Success, title: "Tag created and added", message: name });
      onTagCreatedAndAdded(name);
      pop();
    } catch (err) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to create tag",
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create and Add Tag" icon={Icon.Plus} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="Tag Name" placeholder="Enter tag name..." autoFocus />
      <Form.Dropdown id="color" title="Color" defaultValue="">
        <Form.Dropdown.Item title="Default" value="" icon={{ source: Icon.Circle, tintColor: Color.PrimaryText }} />
        {TAG_COLORS.filter((c) => c.name !== "Default").map((color) => (
          <Form.Dropdown.Item
            key={color.name}
            title={color.name}
            value={color.name}
            icon={{ source: Icon.CircleFilled, tintColor: color.value }}
          />
        ))}
      </Form.Dropdown>
    </Form>
  );
}

export default function EditWorkspaceTags({ workspace, onTagsUpdated }: Props) {
  const [workspaceTags, setWorkspaceTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<TagInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [registry, current] = await Promise.all([getTagRegistry(), getTags(workspace.id)]);
      setAvailableTags(registry);
      setWorkspaceTags(current);
    } catch (err) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to load tags",
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateTags = (newTags: string[]) => {
    setWorkspaceTags(newTags);
    onTagsUpdated(workspace.id, newTags);
  };

  const handleAddTag = async (tagName: string) => {
    try {
      await addTagToWorkspace(workspace.id, tagName);
      updateTags([...workspaceTags, tagName]);
      await showToast({ style: Toast.Style.Success, title: "Tag added", message: tagName });
    } catch (err) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to add tag",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleRemoveTag = async (tagName: string) => {
    try {
      await removeTagFromWorkspace(workspace.id, tagName);
      updateTags(workspaceTags.filter((t) => t !== tagName));
      await showToast({ style: Toast.Style.Success, title: "Tag removed", message: tagName });
    } catch (err) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to remove tag",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleTagCreatedAndAdded = (tagName: string) => {
    updateTags([...workspaceTags, tagName]);
    loadData(); // Reload to get the new tag in the registry
  };

  // Partition tags into assigned and unassigned
  const assignedTags = availableTags.filter((t) => workspaceTags.includes(t.name));
  const unassignedTags = availableTags.filter((t) => !workspaceTags.includes(t.name));

  const createNewTagAction = (
    <Action.Push
      title="Create New Tag"
      icon={Icon.Plus}
      shortcut={Keyboard.Shortcut.Common.New}
      target={<CreateAndAddTagForm workspaceId={workspace.id} onTagCreatedAndAdded={handleTagCreatedAndAdded} />}
    />
  );

  const renderEmptyAssigned = () => (
    <List.Item
      title="No tags assigned"
      subtitle="Add a tag from the available tags below"
      icon={{ source: Icon.Tag, tintColor: Color.SecondaryText }}
      actions={<ActionPanel>{createNewTagAction}</ActionPanel>}
    />
  );

  const renderAssignedTag = (tag: TagInfo) => (
    <List.Item
      key={tag.name}
      title={tag.name}
      icon={{ source: Icon.CheckCircle, tintColor: getTagColorValue(tag.color) }}
      accessories={[{ icon: Icon.Minus, tooltip: "Remove tag" }]}
      actions={
        <ActionPanel>
          <Action
            title="Remove Tag"
            icon={Icon.Minus}
            style={Action.Style.Destructive}
            onAction={() => handleRemoveTag(tag.name)}
          />
          {createNewTagAction}
        </ActionPanel>
      }
    />
  );

  const renderUnassignedTag = (tag: TagInfo) => (
    <List.Item
      key={tag.name}
      title={tag.name}
      icon={{ source: Icon.Circle, tintColor: getTagColorValue(tag.color) }}
      accessories={[{ icon: Icon.Plus, tooltip: "Add tag" }]}
      actions={
        <ActionPanel>
          <Action title="Add Tag" icon={Icon.Plus} onAction={() => handleAddTag(tag.name)} />
          {createNewTagAction}
        </ActionPanel>
      }
    />
  );

  const renderEmptyUnassigned = () => {
    const allAssigned = availableTags.length > 0;
    return (
      <List.Item
        title={allAssigned ? "All tags are assigned" : "No tags exist yet"}
        subtitle={allAssigned ? "Create a new tag to add more" : "Create your first tag"}
        icon={{ source: allAssigned ? Icon.CheckCircle : Icon.Plus, tintColor: allAssigned ? Color.Green : Color.Blue }}
        actions={<ActionPanel>{createNewTagAction}</ActionPanel>}
      />
    );
  };

  return (
    <List isLoading={isLoading} navigationTitle={`Edit Tags - ${workspace.name}`} searchBarPlaceholder="Search tags...">
      <List.Section title="Assigned Tags" subtitle={`${assignedTags.length} ${pluralize(assignedTags.length, "tag")}`}>
        {assignedTags.length === 0 ? renderEmptyAssigned() : assignedTags.map(renderAssignedTag)}
      </List.Section>

      <List.Section
        title="Available Tags"
        subtitle={`${unassignedTags.length} ${pluralize(unassignedTags.length, "tag")}`}
      >
        {unassignedTags.length === 0 ? renderEmptyUnassigned() : unassignedTags.map(renderUnassignedTag)}
      </List.Section>
    </List>
  );
}

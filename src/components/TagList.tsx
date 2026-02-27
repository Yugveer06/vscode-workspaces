import {
  Action,
  ActionPanel,
  Alert,
  Color,
  Form,
  Icon,
  Keyboard,
  List,
  confirmAlert,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useState } from "react";

import { TAG_COLORS } from "@constants/tags";
import {
  getAllTagsWithUsage,
  createTag,
  deleteTag,
  renameTag,
  updateTagColor,
  type TagInfo,
} from "@services/storageService";
import { getTagColorValue } from "@utils/tags";
import { pluralize } from "@utils/text";

interface TagWithUsage extends TagInfo {
  usageCount: number;
}

// Shared form for tag color selection
function TagColorDropdown({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <Form.Dropdown id="color" title="Color" defaultValue={defaultValue}>
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
  );
}

interface CreateTagFormProps {
  onTagCreated: () => void;
}

function CreateTagForm({ onTagCreated }: CreateTagFormProps) {
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
      await showToast({ style: Toast.Style.Success, title: "Tag created", message: name });
      onTagCreated();
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
          <Action.SubmitForm title="Create Tag" icon={Icon.Plus} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="Tag Name" placeholder="Enter tag name..." autoFocus />
      <TagColorDropdown />
    </Form>
  );
}

interface EditTagFormProps {
  tag: TagWithUsage;
  onTagUpdated: () => void;
}

function EditTagForm({ tag, onTagUpdated }: EditTagFormProps) {
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
      // Rename if name changed
      if (name !== tag.name) {
        await renameTag(tag.name, name);
      }
      // Update color if changed
      if (values.color !== (tag.color || "")) {
        await updateTagColor(name, values.color || undefined);
      }
      await showToast({ style: Toast.Style.Success, title: "Tag updated", message: name });
      onTagUpdated();
      pop();
    } catch (err) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to update tag",
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
          <Action.SubmitForm title="Save Changes" icon={Icon.Check} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="Tag Name" defaultValue={tag.name} autoFocus />
      <TagColorDropdown defaultValue={tag.color || ""} />
    </Form>
  );
}

export default function TagList() {
  const [tags, setTags] = useState<TagWithUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTags = async () => {
    try {
      const allTags = await getAllTagsWithUsage();
      setTags(allTags.sort((a, b) => a.name.localeCompare(b.name)));
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
    loadTags();
  }, []);

  const handleDeleteTag = async (tag: TagWithUsage) => {
    const message =
      tag.usageCount > 0
        ? `Are you sure you want to delete "${tag.name}"? It will be removed from ${tag.usageCount} ${pluralize(tag.usageCount, "workspace")}.`
        : `Are you sure you want to delete "${tag.name}"?`;

    const confirmed = await confirmAlert({
      title: "Delete Tag",
      message,
      primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
    });

    if (!confirmed) return;

    try {
      await showToast({ style: Toast.Style.Animated, title: "Deleting tag...", message: tag.name });
      await deleteTag(tag.name);
      setTags((prev) => prev.filter((t) => t.name !== tag.name));
      await showToast({ style: Toast.Style.Success, title: "Tag deleted", message: tag.name });
    } catch (err) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to delete tag",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const createTagAction = (
    <Action.Push title="Create Tag" icon={Icon.Plus} target={<CreateTagForm onTagCreated={loadTags} />} />
  );

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search tags...">
      <List.EmptyView
        title="No Tags"
        description="Create a tag to get started"
        icon={Icon.Tag}
        actions={<ActionPanel>{createTagAction}</ActionPanel>}
      />

      {tags.map((tag) => (
        <List.Item
          key={tag.name}
          title={tag.name}
          subtitle={`${tag.usageCount} ${pluralize(tag.usageCount, "workspace")}`}
          icon={{ source: Icon.Tag, tintColor: getTagColorValue(tag.color) }}
          accessories={[
            {
              text: new Date(tag.createdAt).toLocaleDateString(),
              tooltip: `Created: ${new Date(tag.createdAt).toLocaleString()}`,
            },
          ]}
          actions={
            <ActionPanel>
              <ActionPanel.Section title="Edit">
                <Action.Push
                  title="Edit Tag"
                  icon={Icon.Pencil}
                  shortcut={Keyboard.Shortcut.Common.Edit}
                  target={<EditTagForm tag={tag} onTagUpdated={loadTags} />}
                />
                <Action.Push
                  title="Create Tag"
                  icon={Icon.Plus}
                  shortcut={Keyboard.Shortcut.Common.New}
                  target={<CreateTagForm onTagCreated={loadTags} />}
                />
              </ActionPanel.Section>
              <ActionPanel.Section title="Clipboard">
                <Action.CopyToClipboard
                  title="Copy Tag Name"
                  content={tag.name}
                  shortcut={Keyboard.Shortcut.Common.Copy}
                />
              </ActionPanel.Section>
              <ActionPanel.Section title="Danger Zone">
                <Action
                  title="Delete Tag"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  shortcut={Keyboard.Shortcut.Common.Remove}
                  onAction={() => handleDeleteTag(tag)}
                />
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

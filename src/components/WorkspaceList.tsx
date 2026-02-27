import { Action, ActionPanel, Color, Icon, Keyboard, List } from "@raycast/api";
import { useEffect, useState } from "react";

import EditWorkspaceTags from "@components/EditWorkspaceTags";
import TagList from "@components/TagList";
import { PROJECT_TYPE_NAMES } from "@constants/projectTypes";
import { UNTAGGED_FILTER } from "@constants/tags";
import { getTagRegistry } from "@services/storageService";
import { getTagColorValue } from "@utils/tags";
import { pluralize } from "@utils/text";
import { formatTimeAgo, isRecentlyOpened } from "@utils/time";

import type { SortOption, WorkspaceWithMetadata } from "@/types";
import type { TagInfo } from "@services/storageService";

interface Props {
  workspaces: WorkspaceWithMetadata[];
  isLoading: boolean;
  sortOption: SortOption;
  onOpen: (w: WorkspaceWithMetadata) => Promise<void>;
  onOpenWith: (w: WorkspaceWithMetadata) => Promise<void>;
  onToggleFavorite: (w: WorkspaceWithMetadata) => Promise<void>;
  onOpenTerminal: (w: WorkspaceWithMetadata) => Promise<void>;
  onRevealInFinder: (w: WorkspaceWithMetadata) => Promise<void>;
  onDelete: (w: WorkspaceWithMetadata) => Promise<void>;
  onSortChange: (sortOption: SortOption) => Promise<void>;
  onTagsUpdated: (workspaceId: string, tags: string[]) => void;
}

interface WorkspaceGroup {
  title: string;
  subtitle: string;
  workspaces: WorkspaceWithMetadata[];
}

export default function WorkspaceList({
  workspaces,
  isLoading,
  sortOption,
  onOpen,
  onOpenWith,
  onToggleFavorite,
  onOpenTerminal,
  onRevealInFinder,
  onDelete,
  onSortChange,
  onTagsUpdated,
}: Props) {
  const [tagRegistry, setTagRegistry] = useState<TagInfo[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);

  // Load tag registry when workspaces change
  useEffect(() => {
    getTagRegistry().then(setTagRegistry);
  }, [workspaces]);

  // Get color for a tag by looking up in registry
  const getTagColor = (tagName: string): Color => {
    const tagInfo = tagRegistry.find((t) => t.name === tagName);
    return getTagColorValue(tagInfo?.color);
  };

  // Filter management
  const addFilterTag = (tag: string) => {
    if (!filterTags.includes(tag)) {
      setFilterTags([...filterTags, tag]);
    }
  };

  const removeFilterTag = (tag: string) => {
    setFilterTags(filterTags.filter((t) => t !== tag));
  };

  const clearFilters = () => setFilterTags([]);

  // Apply filters (AND logic: workspace must have ALL selected tags)
  const filteredWorkspaces =
    filterTags.length === 0
      ? workspaces
      : filterTags.includes(UNTAGGED_FILTER)
        ? workspaces.filter((w) => !w.metadata.tags?.length)
        : workspaces.filter((w) => {
            const tags = w.metadata.tags ?? [];
            return filterTags.every((t) => tags.includes(t));
          });

  // All unique tags in use
  const allUsedTags = [...new Set(workspaces.flatMap((w) => w.metadata.tags ?? []))].sort();

  // Group workspaces based on sort option
  const getGroupedWorkspaces = (): WorkspaceGroup[] => {
    const createEmptyGroup = (): WorkspaceGroup[] => [{ title: "Workspaces", subtitle: "0", workspaces: [] }];

    switch (sortOption) {
      case "recently-opened": {
        const recent = filteredWorkspaces.filter((w) => isRecentlyOpened(w.metadata.lastOpened));
        const other = filteredWorkspaces.filter((w) => !isRecentlyOpened(w.metadata.lastOpened));

        const groups: WorkspaceGroup[] = [];
        if (recent.length)
          groups.push({ title: "Recent Workspaces", subtitle: `${recent.length}`, workspaces: recent });
        if (other.length) groups.push({ title: "Other Workspaces", subtitle: `${other.length}`, workspaces: other });

        return groups.length ? groups : createEmptyGroup();
      }

      case "favorites-first": {
        const favorites = filteredWorkspaces.filter((w) => w.metadata.isFavorite);
        const other = filteredWorkspaces.filter((w) => !w.metadata.isFavorite);

        const groups: WorkspaceGroup[] = [];
        if (favorites.length)
          groups.push({ title: "Favourite Workspaces", subtitle: `${favorites.length}`, workspaces: favorites });
        if (other.length) groups.push({ title: "Other Workspaces", subtitle: `${other.length}`, workspaces: other });

        return groups.length ? groups : createEmptyGroup();
      }

      case "project-type": {
        const groupMap = new Map<string, WorkspaceWithMetadata[]>();

        for (const w of filteredWorkspaces) {
          const type = w.projectType || "other";
          const group = groupMap.get(type) ?? [];
          group.push(w);
          groupMap.set(type, group);
        }

        // Sort alphabetically, keeping "other" at the end
        const sortedTypes = [...groupMap.keys()].sort((a, b) => {
          if (a === "other") return 1;
          if (b === "other") return -1;
          return (PROJECT_TYPE_NAMES[a] || a).localeCompare(PROJECT_TYPE_NAMES[b] || b);
        });

        const groups = sortedTypes.map((type) => ({
          title: PROJECT_TYPE_NAMES[type] || (type === "other" ? "Other Projects" : type),
          subtitle: `${groupMap.get(type)!.length}`,
          workspaces: groupMap.get(type)!,
        }));

        return groups.length ? groups : createEmptyGroup();
      }

      case "alphabetical":
      default:
        return [{ title: "Workspaces", subtitle: `${filteredWorkspaces.length}`, workspaces: filteredWorkspaces }];
    }
  };

  const groupedWorkspaces = getGroupedWorkspaces();

  // Render a single workspace item
  const renderWorkspaceItem = (w: WorkspaceWithMetadata) => {
    const tags = w.metadata.tags ?? [];
    const accessories: List.Item.Accessory[] = [];

    // Time ago
    if (w.metadata.lastOpened) {
      accessories.push({ text: formatTimeAgo(w.metadata.lastOpened) });
    }

    // Favorite star
    if (w.metadata.isFavorite) {
      accessories.push({ icon: Icon.Star, tooltip: "Favorite" });
    }

    // Tags
    for (const tag of tags) {
      accessories.push({ tag: { value: tag, color: getTagColor(tag) } });
    }

    return (
      <List.Item
        key={w.id}
        title={w.name}
        subtitle={w.path}
        icon={{ source: w.icon }}
        accessories={accessories}
        keywords={[w.name, w.name.replace(/[-_\s]/g, ""), w.path, ...tags]}
        actions={
          <ActionPanel>
            <ActionPanel.Section title="Open">
              <Action title="Open in VS Code" icon={Icon.Code} onAction={() => onOpen(w)} />
              <Action.OpenWith
                shortcut={Keyboard.Shortcut.Common.OpenWith}
                path={w.path}
                onOpen={() => onOpenWith(w)}
              />
            </ActionPanel.Section>

            <ActionPanel.Section title="Quick Actions">
              <Action
                title={w.metadata.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                icon={w.metadata.isFavorite ? Icon.StarDisabled : Icon.Star}
                shortcut={Keyboard.Shortcut.Common.Pin}
                onAction={() => onToggleFavorite(w)}
              />
              <Action
                title="Open in Terminal"
                icon={Icon.Terminal}
                shortcut={{ Windows: { modifiers: ["ctrl"], key: "t" }, macOS: { modifiers: ["cmd"], key: "t" } }}
                onAction={() => onOpenTerminal(w)}
              />
              <Action
                title={process.platform === "darwin" ? "Reveal in Finder" : "Reveal in Explorer"}
                icon={process.platform === "darwin" ? Icon.Finder : Icon.Folder}
                shortcut={{
                  Windows: { modifiers: ["ctrl", "shift"], key: "e" },
                  macOS: { modifiers: ["cmd", "shift"], key: "e" },
                }}
                onAction={() => onRevealInFinder(w)}
              />
            </ActionPanel.Section>

            <ActionPanel.Section title="Tags">
              <Action.Push
                title="Edit Tags"
                icon={Icon.Tag}
                shortcut={Keyboard.Shortcut.Common.Edit}
                target={<EditWorkspaceTags workspace={w} onTagsUpdated={onTagsUpdated} />}
              />
              <Action.Push
                title="Manage All Tags"
                icon={Icon.BulletPoints}
                shortcut={{ modifiers: ["cmd", "shift"], key: "t" }}
                target={<TagList />}
              />
            </ActionPanel.Section>

            <ActionPanel.Section title="Filter">
              {tags.length > 0 ? (
                tags.map((tag) =>
                  filterTags.includes(tag) ? (
                    <Action
                      key={tag}
                      title={`Remove #${tag} from Filter`}
                      icon={{ source: Icon.Minus, tintColor: getTagColor(tag) }}
                      onAction={() => removeFilterTag(tag)}
                    />
                  ) : (
                    <Action
                      key={tag}
                      title={`Add #${tag} to Filter`}
                      icon={{ source: Icon.Plus, tintColor: getTagColor(tag) }}
                      onAction={() => addFilterTag(tag)}
                    />
                  ),
                )
              ) : (
                <Action
                  title="Show Untagged Only"
                  icon={Icon.Filter}
                  onAction={() => setFilterTags([UNTAGGED_FILTER])}
                />
              )}
              {filterTags.length > 0 && (
                <Action title="Clear All Filters" icon={Icon.XMarkCircle} onAction={clearFilters} />
              )}
            </ActionPanel.Section>

            <ActionPanel.Section title="Clipboard">
              <Action.CopyToClipboard title="Copy Path" shortcut={Keyboard.Shortcut.Common.CopyPath} content={w.path} />
              <Action.CopyToClipboard title="Copy Name" shortcut={Keyboard.Shortcut.Common.CopyName} content={w.name} />
            </ActionPanel.Section>

            <ActionPanel.Section title="Danger Zone">
              <Action
                title="Delete Workspace"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                shortcut={Keyboard.Shortcut.Common.Remove}
                onAction={() => onDelete(w)}
              />
            </ActionPanel.Section>
          </ActionPanel>
        }
      />
    );
  };

  // Render filter bar item
  const renderFilterBar = () => {
    const isUntaggedFilter = filterTags.includes(UNTAGGED_FILTER);
    const displayTags = filterTags.filter((t) => t !== UNTAGGED_FILTER);

    return (
      <List.Section title="Active Filters">
        <List.Item
          title={
            isUntaggedFilter
              ? "Showing: Untagged Workspaces"
              : `Showing: ${filterTags.map((t) => `#${t}`).join(" AND ")}`
          }
          subtitle={`${filteredWorkspaces.length} ${pluralize(filteredWorkspaces.length, "workspace")} ${pluralize(filteredWorkspaces.length, "matches", "match")}`}
          icon={{ source: Icon.Filter, tintColor: Color.Blue }}
          accessories={displayTags.map((tag) => ({ tag: { value: tag, color: getTagColor(tag) } }))}
          actions={
            <ActionPanel>
              <Action title="Clear All Filters" icon={Icon.XMarkCircle} onAction={clearFilters} />
              <ActionPanel.Section title="Remove Filter">
                {filterTags.map((tag) => (
                  <Action
                    key={tag}
                    title={tag === UNTAGGED_FILTER ? "Remove Untagged Filter" : `Remove #${tag}`}
                    icon={Icon.Minus}
                    onAction={() => removeFilterTag(tag)}
                  />
                ))}
              </ActionPanel.Section>
              <ActionPanel.Section title="Add Filter">
                {allUsedTags
                  .filter((t) => !filterTags.includes(t))
                  .map((tag) => (
                    <Action
                      key={tag}
                      title={`Add #${tag}`}
                      icon={{ source: Icon.Plus, tintColor: getTagColor(tag) }}
                      onAction={() => addFilterTag(tag)}
                    />
                  ))}
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      </List.Section>
    );
  };

  // Render empty state for a group
  const renderEmptyState = () => (
    <List.Item
      title="No Workspaces Found"
      subtitle={filterTags.length > 0 ? "Try removing some filters" : "No VS Code workspaces detected"}
      icon={Icon.MagnifyingGlass}
      actions={
        filterTags.length > 0 ? (
          <ActionPanel>
            <Action title="Clear All Filters" icon={Icon.XMarkCircle} onAction={clearFilters} />
          </ActionPanel>
        ) : undefined
      }
    />
  );

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search VS Code workspaces..."
      searchBarAccessory={
        <List.Dropdown tooltip="Sort By" storeValue value={sortOption} onChange={(v) => onSortChange(v as SortOption)}>
          <List.Dropdown.Item title="Recently Opened" value="recently-opened" icon={Icon.Clock} />
          <List.Dropdown.Item title="Alphabetical (A-Z)" value="alphabetical" icon={Icon.Text} />
          <List.Dropdown.Item title="Favorites First" value="favorites-first" icon={Icon.Star} />
          <List.Dropdown.Item title="Project Type" value="project-type" icon={Icon.Box} />
        </List.Dropdown>
      }
    >
      {!isLoading && (
        <>
          {filterTags.length > 0 && renderFilterBar()}

          {groupedWorkspaces.map((group) => (
            <List.Section key={group.title} title={group.title} subtitle={group.subtitle}>
              {group.workspaces.length === 0 ? renderEmptyState() : group.workspaces.map(renderWorkspaceItem)}
            </List.Section>
          ))}
        </>
      )}
    </List>
  );
}

import { LocalStorage } from "@raycast/api";

import type { WorkspaceMetadata, SortOption } from "@/types";

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  FAVORITES: "workspace-favorites",
  LAST_OPENED: "workspace-last-opened",
  WORKSPACE_TAGS: "workspace-tags",
  TAG_REGISTRY: "tag-registry",
  SORT_PREFERENCE: "sort-preference",
} as const;

// ============================================================================
// Types
// ============================================================================

export interface TagInfo {
  name: string;
  color?: string;
  createdAt: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function getJsonItem<T>(key: string, defaultValue: T): Promise<T> {
  const data = await LocalStorage.getItem<string>(key);
  if (!data) return defaultValue;
  try {
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

async function setJsonItem<T>(key: string, value: T): Promise<void> {
  await LocalStorage.setItem(key, JSON.stringify(value));
}

// ============================================================================
// Favorites
// ============================================================================

export async function getFavorites(): Promise<Set<string>> {
  const data = await getJsonItem<string[]>(STORAGE_KEYS.FAVORITES, []);
  return new Set(data);
}

export async function toggleFavorite(workspaceId: string): Promise<boolean> {
  const favorites = await getFavorites();
  const isFav = favorites.has(workspaceId);

  if (isFav) {
    favorites.delete(workspaceId);
  } else {
    favorites.add(workspaceId);
  }

  await setJsonItem(STORAGE_KEYS.FAVORITES, [...favorites]);
  return !isFav;
}

export async function isFavorite(workspaceId: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.has(workspaceId);
}

// ============================================================================
// Last Opened Timestamps
// ============================================================================

export async function getLastOpenedTimestamps(): Promise<Record<string, number>> {
  return getJsonItem(STORAGE_KEYS.LAST_OPENED, {});
}

export async function updateLastOpened(workspaceId: string): Promise<void> {
  const timestamps = await getLastOpenedTimestamps();
  timestamps[workspaceId] = Date.now();
  await setJsonItem(STORAGE_KEYS.LAST_OPENED, timestamps);
}

export async function getLastOpened(workspaceId: string): Promise<number | undefined> {
  const timestamps = await getLastOpenedTimestamps();
  return timestamps[workspaceId];
}

// ============================================================================
// Tag Registry (Global list of available tags)
// ============================================================================

export async function getTagRegistry(): Promise<TagInfo[]> {
  return getJsonItem(STORAGE_KEYS.TAG_REGISTRY, []);
}

export async function saveTagRegistry(tags: TagInfo[]): Promise<void> {
  await setJsonItem(STORAGE_KEYS.TAG_REGISTRY, tags);
}

export async function createTag(name: string, color?: string): Promise<TagInfo> {
  const registry = await getTagRegistry();
  const trimmedName = name.trim();

  // Check for duplicates (case-insensitive)
  if (registry.some((t) => t.name.toLowerCase() === trimmedName.toLowerCase())) {
    throw new Error(`Tag "${trimmedName}" already exists`);
  }

  const newTag: TagInfo = {
    name: trimmedName,
    color,
    createdAt: Date.now(),
  };

  await saveTagRegistry([...registry, newTag]);
  return newTag;
}

export async function deleteTag(tagName: string): Promise<void> {
  // Remove from registry
  const registry = await getTagRegistry();
  await saveTagRegistry(registry.filter((t) => t.name !== tagName));

  // Remove from all workspaces
  const workspaceTags = await getWorkspaceTags();
  const updated: Record<string, string[]> = {};

  for (const [workspaceId, tags] of Object.entries(workspaceTags)) {
    const filtered = tags.filter((t) => t !== tagName);
    if (filtered.length > 0) {
      updated[workspaceId] = filtered;
    }
  }

  await setJsonItem(STORAGE_KEYS.WORKSPACE_TAGS, updated);
}

export async function renameTag(oldName: string, newName: string): Promise<void> {
  const trimmedNewName = newName.trim();
  const registry = await getTagRegistry();

  // Check for duplicates
  const isDuplicate = registry.some((t) => t.name.toLowerCase() === trimmedNewName.toLowerCase() && t.name !== oldName);
  if (isDuplicate) {
    throw new Error(`Tag "${trimmedNewName}" already exists`);
  }

  // Update registry
  const updatedRegistry = registry.map((t) => (t.name === oldName ? { ...t, name: trimmedNewName } : t));
  await saveTagRegistry(updatedRegistry);

  // Update all workspaces
  const workspaceTags = await getWorkspaceTags();
  const updated: Record<string, string[]> = {};

  for (const [workspaceId, tags] of Object.entries(workspaceTags)) {
    updated[workspaceId] = tags.map((t) => (t === oldName ? trimmedNewName : t));
  }

  await setJsonItem(STORAGE_KEYS.WORKSPACE_TAGS, updated);
}

export async function updateTagColor(tagName: string, color: string | undefined): Promise<void> {
  const registry = await getTagRegistry();
  const updated = registry.map((t) => (t.name === tagName ? { ...t, color } : t));
  await saveTagRegistry(updated);
}

export async function getAllTagsWithUsage(): Promise<Array<TagInfo & { usageCount: number }>> {
  const [registry, workspaceTags] = await Promise.all([getTagRegistry(), getWorkspaceTags()]);

  // Count usage for each tag
  const usageCounts: Record<string, number> = {};
  for (const tags of Object.values(workspaceTags)) {
    for (const tag of tags) {
      usageCounts[tag] = (usageCounts[tag] || 0) + 1;
    }
  }

  return registry.map((tag) => ({
    ...tag,
    usageCount: usageCounts[tag.name] || 0,
  }));
}

// ============================================================================
// Workspace Tags (Tags assigned to individual workspaces)
// ============================================================================

export async function getWorkspaceTags(): Promise<Record<string, string[]>> {
  return getJsonItem(STORAGE_KEYS.WORKSPACE_TAGS, {});
}

export async function setWorkspaceTags(workspaceId: string, tags: string[]): Promise<void> {
  const allTags = await getWorkspaceTags();

  if (tags.length === 0) {
    delete allTags[workspaceId];
  } else {
    allTags[workspaceId] = tags;
  }

  await setJsonItem(STORAGE_KEYS.WORKSPACE_TAGS, allTags);
}

export async function addTagToWorkspace(workspaceId: string, tagName: string): Promise<void> {
  const allTags = await getWorkspaceTags();
  const workspaceTags = allTags[workspaceId] || [];

  if (!workspaceTags.includes(tagName)) {
    allTags[workspaceId] = [...workspaceTags, tagName];
    await setJsonItem(STORAGE_KEYS.WORKSPACE_TAGS, allTags);
  }
}

export async function removeTagFromWorkspace(workspaceId: string, tagName: string): Promise<void> {
  const allTags = await getWorkspaceTags();
  const workspaceTags = allTags[workspaceId] || [];
  const filtered = workspaceTags.filter((t) => t !== tagName);

  if (filtered.length === 0) {
    delete allTags[workspaceId];
  } else {
    allTags[workspaceId] = filtered;
  }

  await setJsonItem(STORAGE_KEYS.WORKSPACE_TAGS, allTags);
}

export async function getTags(workspaceId: string): Promise<string[]> {
  const allTags = await getWorkspaceTags();
  return allTags[workspaceId] || [];
}

// ============================================================================
// Sort Preference
// ============================================================================

export async function getSortPreference(): Promise<SortOption> {
  const pref = await LocalStorage.getItem<string>(STORAGE_KEYS.SORT_PREFERENCE);
  return (pref as SortOption) || "alphabetical";
}

export async function setSortPreference(sortOption: SortOption): Promise<void> {
  await LocalStorage.setItem(STORAGE_KEYS.SORT_PREFERENCE, sortOption);
}

// ============================================================================
// Metadata Aggregation
// ============================================================================

export async function getWorkspaceMetadata(workspaceId: string): Promise<WorkspaceMetadata> {
  const [favorite, lastOpened, tags] = await Promise.all([
    isFavorite(workspaceId),
    getLastOpened(workspaceId),
    getTags(workspaceId),
  ]);

  return { isFavorite: favorite, lastOpened, tags };
}

export async function getAllWorkspaceMetadata(workspaceIds: string[]): Promise<Record<string, WorkspaceMetadata>> {
  const [favorites, timestamps, allTags] = await Promise.all([
    getFavorites(),
    getLastOpenedTimestamps(),
    getWorkspaceTags(),
  ]);

  const result: Record<string, WorkspaceMetadata> = {};

  for (const id of workspaceIds) {
    result[id] = {
      isFavorite: favorites.has(id),
      lastOpened: timestamps[id],
      tags: allTags[id] || [],
    };
  }

  return result;
}

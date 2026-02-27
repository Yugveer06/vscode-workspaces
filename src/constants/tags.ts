import { Color } from "@raycast/api";

/**
 * Available colors for tags
 */
export const TAG_COLORS: { name: string; value: Color }[] = [
  { name: "Red", value: Color.Red },
  { name: "Orange", value: Color.Orange },
  { name: "Yellow", value: Color.Yellow },
  { name: "Green", value: Color.Green },
  { name: "Blue", value: Color.Blue },
  { name: "Purple", value: Color.Purple },
  { name: "Magenta", value: Color.Magenta },
  { name: "Default", value: Color.PrimaryText },
];

/**
 * Special filter value for untagged workspaces
 */
export const UNTAGGED_FILTER = "__untagged__";

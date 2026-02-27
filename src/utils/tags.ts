import { Color } from "@raycast/api";

import { TAG_COLORS } from "@constants/tags";

/**
 * Get the Color value for a tag color name
 */
export function getTagColorValue(colorName?: string): Color {
  const found = TAG_COLORS.find((c) => c.name === colorName);
  return found?.value ?? Color.SecondaryText;
}

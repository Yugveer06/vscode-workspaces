import { SEVEN_DAYS_MS } from "@constants/time";

/**
 * Format a timestamp as a relative time string (e.g., "2d ago", "5h ago")
 */
export function formatTimeAgo(timestamp?: number): string {
  if (!timestamp) return "";

  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

/**
 * Check if a timestamp is within the last 7 days
 */
export function isRecentlyOpened(timestamp?: number): boolean {
  if (!timestamp) return false;
  return timestamp > Date.now() - SEVEN_DAYS_MS;
}

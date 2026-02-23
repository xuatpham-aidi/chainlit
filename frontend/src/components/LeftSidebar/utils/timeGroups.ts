/**
 * Time-group helpers for sidebar thread lists.
 * Used by Recent, Grouped (per-topic), and any list grouped by date.
 */

import { TIME_GROUP_ORDER } from '../constants';

export function getSortedTimeGroupKeys(
  timeGroupedThreads: Record<string, unknown[]> | undefined
): string[] {
  if (!timeGroupedThreads) return [];
  return Object.keys(timeGroupedThreads).sort((a, b) => {
    const aIndex = TIME_GROUP_ORDER.indexOf(a as (typeof TIME_GROUP_ORDER)[number]);
    const bIndex = TIME_GROUP_ORDER.indexOf(b as (typeof TIME_GROUP_ORDER)[number]);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });
}

/**
 * Shared constants for LeftSidebar chat history.
 * Single source of truth for magic numbers and config.
 */

export const TIME_GROUP_ORDER = [
  'Today',
  'Yesterday',
  'Previous 7 days',
  'Previous 30 days'
] as const;

export const MAX_THREAD_NAME_LENGTH = 40;

export const LIST_PAGINATION = {
  initialBatch: 10,
  batchSize: 30
} as const;

export const BATCH_FETCH_DELAY_MS = 500;

export const DRAG_ACTIVATION_DISTANCE_PX = 6;
export const CLICK_AFTER_DRAG_SUPPRESS_MS = 300;

export const THREAD_ITEM_REVEAL_DELAY_MS = 35;

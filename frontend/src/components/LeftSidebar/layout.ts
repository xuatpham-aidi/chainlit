/**
 * Unified layout and hierarchy for LeftSidebar chat history.
 * Design goals: single alignment grid, clear "you are here" at section/group/thread,
 * minimal borders, aligned backgrounds.
 */

/** Horizontal padding for sidebar content (one alignment grid). */
export const SIDEBAR_CONTENT_PX = 'px-3';

/** Gap between major sections (Grouped chat, Recent). */
export const SIDEBAR_SECTION_GAP = 'gap-3';

/** Section header: minimal bar, no full border. Clear when it contains the current thread. */
export const SIDEBAR_SECTION_HEADER =
  'w-full flex items-center justify-between gap-2 rounded-lg h-9 min-h-9 pl-3 pr-2 transition-colors duration-150 text-sidebar-foreground/70 hover:text-sidebar-foreground';

export const SIDEBAR_SECTION_HEADER_TITLE =
  'min-w-0 flex-1 truncate text-left text-xs font-semibold tracking-tight';

/** Section that contains the current thread: left accent + soft bg so "you are here" is obvious. */
export const SIDEBAR_SECTION_HEADER_SELECTED =
  'border-l-[3px] border-l-sidebar-foreground bg-sidebar-foreground/10 text-sidebar-foreground';

export const SIDEBAR_SECTION_HEADER_HOVER = 'hover:bg-sidebar-foreground/[0.06]';

/** Group/folder row: same content indent as section (pl-3). Selected = same accent. */
export const SIDEBAR_GROUP_ROW =
  'flex w-full items-center gap-2 py-2 pl-3 pr-2 text-xs font-medium tracking-tight transition-colors duration-150 rounded-md';

export const SIDEBAR_GROUP_ROW_BG = 'bg-transparent hover:bg-sidebar-foreground/[0.06]';
export const SIDEBAR_GROUP_ROW_SELECTED =
  'bg-sidebar-foreground/10 text-sidebar-foreground border-l-[3px] border-l-sidebar-foreground';

/** Sticky group header: same bg as sidebar so it doesn't flash on scroll. */
export const SIDEBAR_GROUP_ROW_STICKY =
  'sticky z-[5] !bg-sidebar border-b border-sidebar-border/30 transition-colors duration-150';

/** Thread (leaf) item: indent one level from group so hierarchy is obvious. */
export const SIDEBAR_THREAD_ITEM_PADDING = 'rounded-md pl-6 pr-2 py-2 my-0.5';
export const SIDEBAR_THREAD_ITEM_TEXT = 'truncate text-left text-sm';

/** Strong "active" state for the current thread only. */
export const SIDEBAR_THREAD_ITEM_ACTIVE = '!bg-sidebar-foreground/15';

export const SIDEBAR_GROUP_ICON_SIZE = 'h-3.5 w-3.5';
export const SIDEBAR_THREAD_ICON_SIZE = 'h-4 w-4';

/** Block that wraps time groups: no extra horizontal padding so rows align to SIDEBAR_CONTENT_PX. */
export const SIDEBAR_GROUP_BLOCK_PADDING = 'py-1';

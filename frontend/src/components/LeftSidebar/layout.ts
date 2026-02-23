/**
 * LeftSidebar chat history: big-tech style.
 * - Friendly: generous spacing, soft hovers, clear hierarchy.
 * - Clean: minimal borders, typography-led, no visual noise.
 * - Single alignment grid; section > group > time > thread.
 */

/** Horizontal padding for all sidebar content (one grid). */
export const SIDEBAR_CONTENT_PX = 'px-3';

/** Vertical gap between major sections (Grouped chat, Recent). */
export const SIDEBAR_SECTION_GAP = 'gap-5';

/** Chat history block: one tray for title + list (same background). */
export const SIDEBAR_HISTORY_ZONE_BG = 'bg-sidebar-foreground/[0.02] rounded-2xl overflow-hidden';

/** Main "Chat history" label inside the tray (top of block). */
export const SIDEBAR_SECTION_HEADER =
  'w-full flex shrink-0 items-center justify-between gap-2 h-10 min-h-10 pl-3 pr-2 rounded-t-2xl transition-colors duration-200';

export const SIDEBAR_SECTION_HEADER_TITLE =
  'min-w-0 flex-1 truncate text-left text-[13px] font-medium tracking-tight text-sidebar-foreground/70';

export const SIDEBAR_SECTION_HEADER_HOVER = 'hover:bg-sidebar-foreground/[0.03] rounded-lg';

/** Major section (Grouped / Recent): clear but not loud. */
export const SIDEBAR_MAJOR_SECTION_HEADER =
  'flex items-center gap-2 w-full h-10 min-h-10 pl-3 pr-2 rounded-xl transition-colors duration-200 text-[13px] font-medium tracking-tight';

/** Section that contains the current thread: thin left bar only (clean when collapsed). */
export const SIDEBAR_SECTION_HEADER_SELECTED =
  'text-sidebar-foreground/90 rounded-r-xl shadow-[inset_2px_0_0_0_hsl(var(--sidebar-foreground)_/_0.45)]';

/** Wrapper when section contains current thread: left bar only, no extra bg. */
export const SIDEBAR_SECTION_WRAPPER_SELECTED =
  'rounded-2xl shadow-[inset_2px_0_0_0_hsl(var(--sidebar-foreground)_/_0.35)]';

/** Group/folder row. */
export const SIDEBAR_GROUP_ROW =
  'flex w-full items-center gap-2 py-2.5 pl-3 pr-2 text-[13px] font-medium tracking-tight transition-colors duration-200 rounded-xl';

export const SIDEBAR_GROUP_ROW_BG = 'bg-transparent hover:bg-sidebar-foreground/[0.03]';

/** Group row that contains the current thread: thin left bar only (clean when collapsed). */
export const SIDEBAR_GROUP_ROW_SELECTED =
  'text-sidebar-foreground/90 rounded-r-xl shadow-[inset_2px_0_0_0_hsl(var(--sidebar-foreground)_/_0.45)]';

/** Sticky group/time header: solid bg so scrolling content does not show through (no opacity/z-index issues). */
export const SIDEBAR_GROUP_ROW_STICKY =
  'sticky z-[5] bg-sidebar transition-colors duration-200';

/** Time-group row (Today, Yesterday): secondary hierarchy. */
export const SIDEBAR_TIME_GROUP_ROW = 'text-sidebar-foreground/55 text-[12px] font-medium';

/** Thread item: one level indent. */
export const SIDEBAR_THREAD_ITEM_PADDING = 'rounded-xl pl-6 pr-2 py-2.5 my-0.5';
export const SIDEBAR_THREAD_ITEM_TEXT = 'truncate text-left text-[13px]';

/** Active thread: soft highlight only. */
export const SIDEBAR_THREAD_ITEM_ACTIVE = 'bg-sidebar-foreground/[0.06]';

export const SIDEBAR_GROUP_ICON_SIZE = 'h-3.5 w-3.5';
export const SIDEBAR_THREAD_ICON_SIZE = 'h-4 w-4';

export const SIDEBAR_GROUP_BLOCK_PADDING = 'py-0.5';

/** Group block when it contains the current thread: no extra bg (row left bar is enough). */
export const SIDEBAR_GROUP_BLOCK_SELECTED = '';

/**
 * Left sidebar chat history – NBC style (big-tech, friendly, addictive).
 * @see enbc/db_ignore/nbc_style.md
 *
 * Design principles:
 * - Rounded corners 8–12px, soft cards, no harsh edges.
 * - Generous spacing, balanced padding/margin, clear hierarchy.
 * - All states: default, hover, selected, focus-visible, active.
 * - Smooth transitions (ease-out 200ms), subtle hover elevation.
 * - Sticky headers opaque for clean stacking.
 * - Block A: New chat (primary) + Search (soft). Block B: Topics + Recent.
 *
 * Spacing scale: 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px).
 */

/** Horizontal padding for sidebar content (aligns list items and headers). */
export const SIDEBAR_CONTENT_PX = 'px-4';

/** Indentation for hierarchy: level 0 = topic / section (e.g. pl-4), level 1 = time group or thread in Recent, level 2 = thread under topic. */
export const SIDEBAR_LEVEL_0_PL = 'pl-4';
export const SIDEBAR_LEVEL_1_PL = 'pl-6';
export const SIDEBAR_LEVEL_2_PL = 'pl-8';

/** Right padding for full-width zone header so its content aligns with scroll content (scrollbar 8px + content 16px + row pr-3 = 36px). */
export const SIDEBAR_ZONE_HEADER_RIGHT = 'pr-9';

/** Vertical gap between major blocks (New chat, Search, Chat history). */
export const SIDEBAR_OUTER_GAP = 'gap-4';

/** Vertical gap between sections inside history (Grouped chat vs Recent). */
export const SIDEBAR_SECTION_GAP = 'gap-5';

/** Vertical gap between section header and its content (e.g. "Grouped chat" to create button). */
export const SIDEBAR_SECTION_HEADER_TO_CONTENT_GAP = 'gap-4';

/** Inner gap within a section (e.g. create group button and topic list). */
export const SIDEBAR_SECTION_INNER_GAP = 'gap-3';

/** Space between topic-group label and its children (date groups / thread list). */
export const SIDEBAR_TOPIC_TO_CHILDREN_GAP = 'pt-3';

/** Sticky stacking: no gap so scrolled content is fully hidden. Section header h-11 = 2.75rem; topic row starts where it ends. */
export const SIDEBAR_TOPIC_ROW_STICKY_TOP = 'top-[2.75rem]';
/** Topic row min-h-[2.5rem]; date-time row starts where topic ends. */
export const SIDEBAR_TIME_GROUP_ROW_STICKY_TOP = 'top-[5.25rem]';

/** Chat history zone: soft card, rounded-xl, very subtle background. */
export const SIDEBAR_HISTORY_ZONE_BG =
  'bg-sidebar-foreground/[0.03] dark:bg-sidebar-foreground/[0.06] rounded-xl overflow-hidden';

/** Sticky header bg (matches zone so no strip when scrolling). */
export const SIDEBAR_STICKY_HEADER_BG =
  'bg-sidebar-foreground/[0.03] dark:bg-sidebar-foreground/[0.06]';

/** Sticky section header: opaque so content below fully hides when stacking. */
export const SIDEBAR_STICKY_SECTION_HEADER_BG = 'bg-sidebar';

/** Main "Chat history" header inside zone. */
export const SIDEBAR_SECTION_HEADER =
  'w-full flex shrink-0 items-center justify-between gap-2 h-11 min-h-[2.75rem] pl-4 pr-3 py-0 rounded-t-xl transition-colors duration-200 ease-out';

export const SIDEBAR_SECTION_HEADER_TITLE =
  'min-w-0 flex-1 truncate text-left text-[13px] font-medium tracking-tight text-sidebar-foreground/75';

/** Section header: default (no hover). */
export const SIDEBAR_SECTION_HEADER_DEFAULT = '';

/** Section header: hover. */
export const SIDEBAR_SECTION_HEADER_HOVER =
  'hover:bg-sidebar-foreground/[0.05] hover:text-sidebar-foreground/95 rounded-lg';

/** Section header selected (non-sticky): tint + left bar. */
export const SIDEBAR_SECTION_HEADER_SELECTED =
  'text-sidebar-foreground rounded-r-xl bg-sidebar-foreground/[0.06] dark:bg-sidebar-foreground/[0.09] shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary))]';

/** When wrapper shows left bar, header only needs tint. */
export const SIDEBAR_SECTION_HEADER_SELECTED_IN_WRAPPER =
  'text-sidebar-foreground rounded-r-xl bg-sidebar-foreground/[0.06] dark:bg-sidebar-foreground/[0.09]';

/** Sticky section header selected: left bar, opaque. */
export const SIDEBAR_SECTION_HEADER_SELECTED_STICKY =
  'text-sidebar-foreground rounded-r-xl bg-sidebar shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary))]';

/** Wrapper when section contains current thread: left accent bar. */
export const SIDEBAR_SECTION_WRAPPER_SELECTED =
  'rounded-xl shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary)_/_0.7)]';

/** Reserve left space for accent bar so selection does not cause layout shift. */
export const SIDEBAR_SECTION_LEFT_BAR_PADDING = 'pl-[3px]';

/** Major section (Topics / Recent): one tap target, friendly height. */
export const SIDEBAR_MAJOR_SECTION_HEADER =
  'flex items-center gap-2.5 w-full h-11 min-h-[2.75rem] pl-4 pr-3 py-0 rounded-xl transition-colors duration-200 ease-out text-[13px] font-medium tracking-tight';

/** Section header default (unselected, unhover). */
export const SIDEBAR_MAJOR_SECTION_HEADER_DEFAULT = 'text-sidebar-foreground/75';

/** Section header hover (unselected). */
export const SIDEBAR_MAJOR_SECTION_HEADER_HOVER =
  'hover:bg-sidebar-foreground/[0.05] hover:text-sidebar-foreground';

/** Group/topic row base. */
export const SIDEBAR_GROUP_ROW =
  'flex w-full items-center gap-2.5 py-2 pl-4 pr-3 min-h-[2.5rem] text-[13px] font-medium tracking-tight transition-colors duration-200 ease-out rounded-xl';

/** Group row: default (unselected, unhover). */
export const SIDEBAR_GROUP_ROW_DEFAULT = 'text-sidebar-foreground/85 bg-transparent';

/** Group row: hover (unselected). */
export const SIDEBAR_ROW_BG =
  'bg-transparent hover:bg-sidebar-foreground/[0.05] dark:hover:bg-sidebar-foreground/[0.07]';

export const SIDEBAR_GROUP_ROW_BG = SIDEBAR_ROW_BG;

/** Group row selected: left bar + tint. */
export const SIDEBAR_GROUP_ROW_SELECTED =
  'text-sidebar-foreground rounded-r-xl bg-sidebar-foreground/[0.07] dark:bg-sidebar-foreground/[0.1] shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary))]';

/** Sticky group row selected: left bar only, opaque. */
export const SIDEBAR_GROUP_ROW_SELECTED_STICKY =
  'text-sidebar-foreground rounded-r-xl bg-sidebar shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary))]';

/** Sticky group row: solid bg for stacking. */
export const SIDEBAR_GROUP_ROW_STICKY =
  'sticky z-[5] bg-sidebar transition-colors duration-200 ease-out';

/** Time-group sticky row (Today, Yesterday): below topic-group rows (z-[10..19]) so parent covers child when stacked. */
export const SIDEBAR_TIME_GROUP_ROW_STICKY =
  'sticky z-[1] bg-sidebar transition-colors duration-200 ease-out';

/** Time-group row (Today, Yesterday): secondary hierarchy. */
export const SIDEBAR_TIME_GROUP_ROW =
  'text-sidebar-foreground/60 text-[12px] font-medium tracking-tight';

/** Wrapper for time-group row when sticky; keeps rounded corners. */
export const SIDEBAR_TIME_GROUP_ROW_WRAPPER = 'rounded-xl';

/** Thread item: comfortable tap target, rounded. */
export const SIDEBAR_THREAD_ITEM_PADDING =
  'rounded-xl pl-4 pr-3 py-2 min-h-[2.5rem] my-1';
export const SIDEBAR_THREAD_ITEM_TEXT =
  'truncate text-left text-[13px] tracking-tight';

/** Thread item: default (unselected, unhover). */
export const SIDEBAR_THREAD_ITEM_DEFAULT =
  'text-sidebar-foreground/88 bg-transparent';

/** Thread item: hover (unselected). */
export const SIDEBAR_THREAD_ITEM_HOVER =
  'hover:bg-sidebar-foreground/[0.05] dark:hover:bg-sidebar-foreground/[0.07]';

/** Thread item: selected/active – left accent bar + stronger tint so user can clearly see which thread is selected. */
export const SIDEBAR_THREAD_ITEM_ACTIVE =
  'rounded-r-xl bg-sidebar-foreground/[0.1] dark:bg-sidebar-foreground/[0.15] text-sidebar-foreground font-medium shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary))]';

/** Thread item: open (dropdown/menu open but not selected). */
export const SIDEBAR_THREAD_ITEM_OPEN =
  'bg-sidebar-foreground/[0.05] dark:bg-sidebar-foreground/[0.07]';

export const SIDEBAR_GROUP_ICON_SIZE = 'h-3.5 w-3.5';
export const SIDEBAR_THREAD_ICON_SIZE = 'h-4 w-4';

/** Time-group block vertical spacing (Today, Yesterday wrappers). */
export const SIDEBAR_GROUP_BLOCK_PADDING = 'py-2';

export const SIDEBAR_GROUP_BLOCK_SELECTED = '';

/** Primary CTA (New chat): solid Deep Blue / Teal per NBC. */
export const SIDEBAR_CTA_PRIMARY =
  'w-full justify-center gap-2.5 h-11 min-h-11 px-4 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-95 active:scale-[0.98] transition-all duration-200 ease-out text-[13px] font-medium tracking-tight focus-visible:ring-2 focus-visible:ring-sidebar-primary focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar outline-none shadow-sm';

/** Secondary action (Search): soft background, no heavy border. */
export const SIDEBAR_ACTION_SECONDARY =
  'w-full justify-between gap-2 h-10 min-h-10 pl-3.5 pr-3 rounded-xl bg-sidebar-foreground/[0.04] dark:bg-sidebar-foreground/[0.08] border border-transparent text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-foreground/[0.07] dark:hover:bg-sidebar-foreground/[0.1] transition-colors duration-200 ease-out text-[13px] font-medium tracking-tight focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar outline-none';

/** Create-group / secondary action button in Topics section. */
export const SIDEBAR_ACTION_BUTTON =
  'w-full justify-start gap-2.5 h-10 min-h-10 pl-4 pr-3 rounded-xl text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-foreground/[0.05] dark:hover:bg-sidebar-foreground/[0.08] transition-colors duration-200 ease-out text-[13px] font-medium tracking-tight focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar outline-none';

/** Count badge in collapsible group row (pill shape). */
export const SIDEBAR_GROUP_COUNT_BADGE =
  'inline-flex items-center justify-center text-[11px] font-medium tabular-nums rounded-full px-2.5 py-0.5 min-w-[1.25rem] transition-colors duration-200';

export const SIDEBAR_GROUP_COUNT_BADGE_DEFAULT =
  'text-sidebar-foreground/55 bg-sidebar-foreground/[0.08] dark:bg-sidebar-foreground/[0.12]';

export const SIDEBAR_GROUP_COUNT_BADGE_SELECTED =
  'bg-sidebar-foreground/12 dark:bg-sidebar-foreground/18 text-sidebar-foreground/90';

/** Focus ring for keyboard users. */
export const SIDEBAR_FOCUS_RING =
  'outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar';

/** Icon button (ellipsis, collapse, etc.): same hover/active in all groups. */
export const SIDEBAR_ICON_BUTTON =
  'flex items-center justify-center h-8 w-8 rounded-xl text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-foreground/[0.06] dark:hover:bg-sidebar-foreground/[0.08] transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar';

/** Dropdown menu item (sidebar context): unified padding and radius. */
export const SIDEBAR_MENU_ITEM =
  'rounded-xl py-2 cursor-pointer';

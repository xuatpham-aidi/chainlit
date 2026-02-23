/**
 * Left sidebar chat history – NBC style (big-tech, friendly, impressive).
 * @see enbc/db_ignore/nbc_style.md
 *
 * Design principles:
 * - Rounded corners 12–16px, soft cards, no harsh edges.
 * - Optimized spacing for narrow sidebar: compact but breathable, clear hierarchy.
 * - Smooth ease-out transitions (150ms), subtle hover/active feedback, fluid micro-interactions (addictive UX).
 * - Block A: New chat (solid Deep Blue/Teal) + Search (soft). Block B: Topics (muted header) + Recent (small label).
 * - Typography: 13.5px section, 13px items, 11.5px labels. Confident, readable.
 */

/** Easing and duration for all interactive elements – snappy, satisfying feel. */
export const SIDEBAR_TRANSITION = 'transition-all duration-150 ease-out';

/**
 * Unified typography and height scale (single source of truth).
 * Hierarchy: section 13.5px > item (topic/thread) 13px > label (time group, recent) 11.5px.
 * Row heights tuned for narrow sidebar: section 2.5rem, rows 2.25rem for tap targets without waste.
 */
export const SIDEBAR_FONT_SECTION = 'text-[13.5px]';
export const SIDEBAR_FONT_ITEM = 'text-[13px]';
export const SIDEBAR_FONT_LABEL = 'text-[11.5px]';

/** Shared min-height for section headers and list rows (tap targets). */
export const SIDEBAR_ROW_MIN_H = 'min-h-[2.25rem]';
export const SIDEBAR_SECTION_HEADER_H = 'h-10 min-h-[2.5rem]';

/** Horizontal padding: compact for narrow sidebar, right minimized to utilize width. */
export const SIDEBAR_CONTENT_PL = 'pl-2.5';
export const SIDEBAR_CONTENT_PR = 'pr-2';
export const SIDEBAR_CONTENT_PX = 'pl-2 pr-1.5';
export const SIDEBAR_GROUP_CONTENT_PX = 'pl-1.5';

/** Indentation: level 0 = section, level 1 = topic/time group header, level 2 = thread. */
export const SIDEBAR_LEVEL_0_PL = 'pl-2';
export const SIDEBAR_LEVEL_1_PL = 'pl-2.5';
export const SIDEBAR_LEVEL_2_PL = 'pl-3.5';

export const SIDEBAR_ZONE_HEADER_RIGHT = 'pr-8';

/**
 * Vertical/horizontal gaps (gap-*, gap-x-*, gap-y-*) set CSS gap and do not collapse on scroll.
 * If spacing appears to collapse when scrolling, the cause is layout (e.g. sticky elements
 * overlapping content below), not gap. Sticky rows in this sidebar use bg-sidebar so they
 * paint over scrolled content without showing overlap.
 */
/** Vertical gap between major blocks (New chat, Search, Chat history) – compact. */
export const SIDEBAR_OUTER_GAP = 'gap-3';

/** Background for main content column so gap space is solid (same as sidebar). */
export const SIDEBAR_MAIN_BG = 'bg-sidebar';

/**
 * Solid gap: separator line between major blocks so the gap reads as a solid band.
 * Apply border-t to the element that follows a gap (e.g. second and third section).
 */
export const SIDEBAR_GAP_SEPARATOR =
  'border-t border-sidebar-border/25 dark:border-sidebar-border/30';

/** Vertical gap between sections inside history (Topics vs Recent). */
export const SIDEBAR_SECTION_GAP = 'gap-3';

/** Separator between Topics and Recent inside the history zone (solid gap). */
export const SIDEBAR_INNER_SECTION_SEPARATOR =
  'border-t border-sidebar-border/20 dark:border-sidebar-border/25';

/** Vertical gap between section header and its content. */
export const SIDEBAR_SECTION_HEADER_TO_CONTENT_GAP = 'gap-2';

/**
 * Wrapper for Topics/Recent sections: same padding and rounded corners whether
 * collapsed or expanded, so expand/collapse does not shift layout (no UX jump).
 */
export const SIDEBAR_GROUP_SECTION_WRAPPER =
  'rounded-xl px-1 py-0.5 transition-colors duration-150 ease-out';

/**
 * Full-section background for expanded Groups (Topics) and Recent.
 * Applied only when expanded; wrapper is always applied so layout stays stable.
 */
export const SIDEBAR_GROUP_SECTION_BG_TOPICS =
  'bg-sidebar-foreground/[0.04] dark:bg-sidebar-foreground/[0.06]';

export const SIDEBAR_GROUP_SECTION_BG_RECENT =
  'bg-sidebar-foreground/[0.03] dark:bg-sidebar-foreground/[0.05]';

/** Inner padding for group section content (when expanded). */
export const SIDEBAR_GROUP_SECTION_INNER = 'px-2 pt-0.5 pb-2';

/** Inner gap within a section. */
export const SIDEBAR_SECTION_INNER_GAP = 'gap-0.5';

export const SIDEBAR_TOPIC_TO_CHILDREN_GAP = 'pt-0.5';

/** Left-padding for folder children – clear nesting depth. */
export const SIDEBAR_FOLDER_CHILDREN_PL = 'pl-4';

export const SIDEBAR_TOPIC_ROW_STICKY_TOP = 'top-[2.5rem]';
export const SIDEBAR_TIME_GROUP_ROW_STICKY_TOP = 'top-[4.75rem]';

/** Chat history zone: soft card, rounded-xl, very subtle background with refined depth. */
export const SIDEBAR_HISTORY_ZONE_BG =
  'bg-sidebar-foreground/[0.02] dark:bg-sidebar-foreground/[0.035] rounded-2xl overflow-hidden shadow-[0_1px_3px_hsl(var(--sidebar-foreground)_/_0.04)] dark:shadow-[0_1px_3px_hsl(var(--sidebar-foreground)_/_0.08)]';

/** Top/bottom borders – unified across sidebar header and section headers. */
export const SIDEBAR_HEADER_BORDER =
  'border-sidebar-border/15 dark:border-sidebar-border/20';
export const SIDEBAR_SECTION_HEADER_BORDER =
  'border-b border-sidebar-border/15 dark:border-sidebar-border/20';

/** Opaque background for sticky headers so scrolled content does not show through. */
export const SIDEBAR_STICKY_HEADER_BG = `bg-sidebar ${SIDEBAR_SECTION_HEADER_BORDER}`;

export const SIDEBAR_STICKY_SECTION_HEADER_BG =
  'bg-sidebar border-b border-sidebar-border/15 dark:border-sidebar-border/20';

/** Main "Chat history" header – compact height, clear typography (13.5px). */
export const SIDEBAR_SECTION_HEADER =
  'w-full flex shrink-0 items-center justify-between gap-2 h-10 min-h-[2.5rem] pl-3 pr-2 py-0 rounded-t-2xl transition-colors duration-150 ease-out';

export const SIDEBAR_SECTION_HEADER_TITLE =
  'min-w-0 flex-1 truncate text-left text-[13.5px] font-semibold tracking-[0.01em] text-sidebar-foreground/85';

export const SIDEBAR_SECTION_HEADER_DEFAULT = '';

export const SIDEBAR_SECTION_HEADER_HOVER =
  'hover:bg-sidebar-foreground/[0.04] dark:hover:bg-sidebar-foreground/[0.06] hover:text-sidebar-foreground rounded-xl';

/**
 * Selected-thread path: use border-left (reserved space) so selection does not shift layout.
 * Default = transparent border; selected = primary color.
 */

/** Section (Topics/Recent) contains selected: lightest tint + 2px bar (border, no shift). */
export const SIDEBAR_SECTION_HEADER_SELECTED =
  'text-sidebar-foreground rounded-r-xl bg-[hsl(var(--sidebar-primary)_/_0.05)] dark:bg-[hsl(var(--sidebar-primary)_/_0.08)] border-l-2 border-[hsl(var(--sidebar-primary))]';

export const SIDEBAR_SECTION_HEADER_SELECTED_IN_WRAPPER =
  'text-sidebar-foreground rounded-r-xl bg-[hsl(var(--sidebar-primary)_/_0.05)] dark:bg-[hsl(var(--sidebar-primary)_/_0.08)] border-l-2 border-[hsl(var(--sidebar-primary))]';

export const SIDEBAR_SECTION_HEADER_SELECTED_STICKY =
  'text-sidebar-foreground rounded-r-xl bg-sidebar border-l-2 border-[hsl(var(--sidebar-primary))]';

/** Section wrapper when it contains selected: 2px bar (border). Wrapper must always have border-l-2 border-transparent. */
export const SIDEBAR_SECTION_WRAPPER_SELECTED =
  'rounded-xl border-l-2 border-[hsl(var(--sidebar-primary))]';
export const SIDEBAR_SECTION_WRAPPER_BAR = 'border-l-2 border-transparent';

export const SIDEBAR_SECTION_LEFT_BAR_PADDING = 'pl-[2px]';

/** Topics section: borderless, muted header – one tap target. Reserve 2px left bar to avoid layout shift. */
export const SIDEBAR_MAJOR_SECTION_HEADER =
  'flex items-center gap-2 w-full h-9 min-h-[2.25rem] border-l-2 border-transparent pl-2.5 pr-2 py-0 rounded-lg transition-all duration-150 ease-out font-semibold tracking-[0.02em] select-none text-[13px]';

export const SIDEBAR_MAJOR_SECTION_HEADER_DEFAULT = 'text-sidebar-foreground/70';

export const SIDEBAR_MAJOR_SECTION_HEADER_HOVER =
  'hover:bg-sidebar-foreground/[0.05] dark:hover:bg-sidebar-foreground/[0.07] hover:text-sidebar-foreground/90';

/** Recent section: same font size and weight as Topics so title/label look identical. */
export const SIDEBAR_MAJOR_SECTION_HEADER_SMALL_LABEL =
  'font-semibold tracking-[0.02em] text-sidebar-foreground/70 dark:text-sidebar-foreground/75 text-[13px]';

/** Group/topic row – compact height. Reserve 2px left bar to avoid layout shift. */
export const SIDEBAR_GROUP_ROW =
  'flex w-full items-center gap-1.5 py-1 border-l-2 border-transparent pl-2.5 pr-2 min-h-[2.125rem] font-medium tracking-[0.01em] transition-all duration-150 ease-out rounded-lg select-none text-[13px] active:scale-[0.98] active:transition-transform active:duration-100';

/** Default text for group rows and thread items – unified hierarchy (85% for list items). */
export const SIDEBAR_GROUP_ROW_DEFAULT = 'text-sidebar-foreground/85 bg-transparent';

export const SIDEBAR_ROW_BG =
  'bg-transparent hover:bg-sidebar-foreground/[0.04] dark:hover:bg-sidebar-foreground/[0.06]';

export const SIDEBAR_GROUP_ROW_BG = SIDEBAR_ROW_BG;

/** Parent (topic/time group) contains selected: subtle flat tint + 2px bar (border); full text. */
export const SIDEBAR_GROUP_ROW_SELECTED =
  'text-sidebar-foreground rounded-r-lg bg-[hsl(var(--sidebar-primary)_/_0.06)] dark:bg-[hsl(var(--sidebar-primary)_/_0.09)] border-l-2 border-[hsl(var(--sidebar-primary))]';

export const SIDEBAR_GROUP_ROW_SELECTED_STICKY =
  'text-sidebar-foreground rounded-r-lg bg-sidebar border-l-2 border-[hsl(var(--sidebar-primary))]';

/** Hover text for group rows – unified with thread items (full on hover). */
export const SIDEBAR_GROUP_ROW_HOVER_TEXT = 'hover:text-sidebar-foreground';

/** Sticky topic/time row: opaque bg + bottom edge so content scrolling under has a clear boundary. */
export const SIDEBAR_GROUP_ROW_STICKY =
  'sticky z-[5] bg-sidebar transition-all duration-150 ease-out border-b border-sidebar-border/15 dark:border-sidebar-border/20';

export const SIDEBAR_TIME_GROUP_ROW_STICKY =
  'sticky z-[1] bg-sidebar transition-all duration-150 ease-out border-b border-sidebar-border/15 dark:border-sidebar-border/20';

/** Time group label (Today, Yesterday…): 11.5px, secondary but readable (55/60%); selected state uses full from SIDEBAR_GROUP_ROW_SELECTED. */
export const SIDEBAR_TIME_GROUP_ROW =
  'text-sidebar-foreground/55 dark:text-sidebar-foreground/60 font-semibold tracking-[0.03em] text-[11px]';

export const SIDEBAR_TIME_GROUP_ROW_WRAPPER = 'rounded-lg';

/** Thread item: compact row height. Always reserve 3px left (transparent or primary) to prevent layout shift on select. */
export const SIDEBAR_THREAD_ITEM_PADDING =
  'rounded-lg border-l-[3px] border-transparent pl-2 pr-1.5 py-1.5 min-h-[2.25rem] my-px box-border';
export const SIDEBAR_THREAD_ITEM_TEXT =
  'truncate text-left tracking-[0.005em] text-[13px]';

/** Thread item default – unified weight with selected (no layout shift on select). Override sidebar base data-[active]:font-medium. */
export const SIDEBAR_THREAD_ITEM_DEFAULT =
  '!font-normal text-sidebar-foreground/85 bg-transparent';

/** Thread item hover/active – bg + text lift to full (unified with group row hover). */
export const SIDEBAR_THREAD_ITEM_HOVER =
  'hover:bg-sidebar-foreground/[0.05] dark:hover:bg-sidebar-foreground/[0.07] hover:text-sidebar-foreground active:bg-sidebar-foreground/[0.07] dark:active:bg-sidebar-foreground/[0.09] active:text-sidebar-foreground';

/** Selected thread: strongest tint + 3px bar (border). Same font-weight as default to prevent layout shift. */
export const SIDEBAR_THREAD_ITEM_ACTIVE =
  '!font-normal rounded-r-lg bg-[hsl(var(--sidebar-primary)_/_0.10)] dark:bg-[hsl(var(--sidebar-primary)_/_0.14)] text-sidebar-foreground border-l-[3px] border-[hsl(var(--sidebar-primary))]';

export const SIDEBAR_THREAD_ITEM_OPEN =
  'bg-sidebar-foreground/[0.04] dark:bg-sidebar-foreground/[0.06]';

export const SIDEBAR_GROUP_ICON_SIZE = 'h-3.5 w-3.5';

/** Folder icon colors: collapsed = muted, expanded = teal-tinted for visual feedback. */
export const SIDEBAR_FOLDER_ICON_COLLAPSED =
  'text-sidebar-foreground/50 transition-colors duration-200 ease-out';
export const SIDEBAR_FOLDER_ICON_EXPANDED =
  'text-[hsl(var(--sidebar-teal))] transition-colors duration-200 ease-out';

/** Tree connector: vertical line on expanded folder children. */
export const SIDEBAR_TREE_CONNECTOR =
  'sidebar-tree-connector';
export const SIDEBAR_THREAD_ICON_SIZE = 'h-3.5 w-3.5';

export const SIDEBAR_GROUP_BLOCK_PADDING = 'py-px';

/** Horizontal padding for group block; always applied so selection only toggles background (no layout shift). */
export const SIDEBAR_GROUP_BLOCK_PX = 'px-0.5';

/** Entire date-time or topic group when it contains the selected thread: very subtle container tint. */
export const SIDEBAR_GROUP_BLOCK_SELECTED =
  'rounded-lg bg-sidebar-foreground/[0.015] dark:bg-sidebar-foreground/[0.03] transition-colors duration-200 ease-out';

/** Primary CTA (New chat): solid Deep Blue / Teal, subtle hover glow – addictive feedback. */
export const SIDEBAR_CTA_PRIMARY =
  'w-full justify-between gap-2 h-10 min-h-10 pl-3.5 pr-2.5 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-[0.92] hover:shadow-[0_2px_16px_hsl(var(--sidebar-primary)_/_0.30)] active:scale-[0.98] transition-all duration-150 ease-out font-semibold tracking-wide focus-visible:ring-2 focus-visible:ring-sidebar-primary focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar outline-none shadow-[0_1px_4px_hsl(var(--sidebar-primary)_/_0.15)] text-[13.5px]';

/** Secondary action (Search): soft background, no heavy border – friendly, discoverable. */
export const SIDEBAR_ACTION_SECONDARY =
  'w-full justify-between gap-2 h-9 min-h-9 pl-3 pr-2.5 rounded-xl bg-sidebar-foreground/[0.04] dark:bg-sidebar-foreground/[0.06] border border-transparent text-sidebar-foreground/65 hover:text-sidebar-foreground/90 hover:bg-sidebar-foreground/[0.07] dark:hover:bg-sidebar-foreground/[0.10] active:bg-sidebar-foreground/[0.09] dark:active:bg-sidebar-foreground/[0.12] transition-all duration-150 ease-out font-medium tracking-wide focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar outline-none text-[13px]';

/** Create-group / secondary action in Topics. */
export const SIDEBAR_ACTION_BUTTON =
  'w-full justify-start gap-2 h-8 min-h-8 pl-2.5 pr-2 rounded-lg text-sidebar-foreground/55 hover:text-sidebar-foreground/85 hover:bg-sidebar-foreground/[0.05] dark:hover:bg-sidebar-foreground/[0.07] transition-all duration-150 ease-out font-medium tracking-wide focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar outline-none text-[12.5px]';

/** Count badge: pill shape, subtle. */
export const SIDEBAR_GROUP_COUNT_BADGE =
  'inline-flex items-center justify-center font-semibold tabular-nums rounded-full px-1.5 py-px min-w-[1rem] transition-colors duration-150 text-[10.5px]';

export const SIDEBAR_GROUP_COUNT_BADGE_DEFAULT =
  'text-sidebar-foreground/45 bg-sidebar-foreground/[0.06] dark:bg-sidebar-foreground/[0.10]';

export const SIDEBAR_GROUP_COUNT_BADGE_SELECTED =
  'bg-sidebar-foreground/12 dark:bg-sidebar-foreground/2 text-sidebar-foreground/85';

export const SIDEBAR_FOCUS_RING =
  'outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar';

/** Icon button (ellipsis, collapse) – compact, clear hover. */
export const SIDEBAR_ICON_BUTTON =
  'flex items-center justify-center h-7 w-7 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground/85 hover:bg-sidebar-foreground/[0.06] dark:hover:bg-sidebar-foreground/[0.08] active:bg-sidebar-foreground/[0.08] dark:active:bg-sidebar-foreground/[0.10] transition-all duration-150 ease-out focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar';

/** Dropdown menu item (sidebar context). */
export const SIDEBAR_MENU_ITEM =
  'rounded-lg py-1.5 cursor-pointer text-[13px]';

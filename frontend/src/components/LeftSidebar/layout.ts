/**
 * Left sidebar chat history – NBC style (big-tech, friendly, impressive).
 * @see enbc/db_ignore/nbc_style.md
 *
 * Design principles:
 * - Rounded corners 10–14px, soft cards, no harsh edges.
 * - Generous spacing, balanced padding/margin, clear level hierarchy (section > topic > time group > thread).
 * - Smooth ease-in-out transitions, subtle hover elevation, fluid micro-interactions.
 * - Block A: New chat (solid Deep Blue/Teal) + Search (soft). Block B: Topics (muted header) + Recent (small label).
 * - Typography: unified scale – 14px section, 13px items, 12px labels. Confident, readable.
 */

/**
 * Unified typography and height scale (single source of truth).
 * Hierarchy: section 14px > item (topic/thread) 13px > label (time group, recent) 12px.
 * Row heights: section header 3rem, major/topic/thread rows 2.75rem for consistent tap targets.
 */
export const SIDEBAR_FONT_SECTION = 'text-[14px]';
export const SIDEBAR_FONT_ITEM = 'text-[13px]';
export const SIDEBAR_FONT_LABEL = 'text-[12px]';

/** Shared min-height for section headers and list rows (tap targets). */
export const SIDEBAR_ROW_MIN_H = 'min-h-[2.75rem]';
export const SIDEBAR_SECTION_HEADER_H = 'h-12 min-h-[3rem]';

/** Horizontal padding: left for hierarchy/alignment, right minimized to utilize width. */
export const SIDEBAR_CONTENT_PL = 'pl-4';
export const SIDEBAR_CONTENT_PR = 'pr-2';
export const SIDEBAR_CONTENT_PX = 'pl-4 pr-2';
export const SIDEBAR_GROUP_CONTENT_PX = 'pl-4';

/** Indentation: level 0 = section, level 1 = topic/time group header, level 2 = thread under topic, level 3 = thread under time. */
export const SIDEBAR_LEVEL_0_PL = 'pl-4';
export const SIDEBAR_LEVEL_1_PL = 'pl-6';
export const SIDEBAR_LEVEL_2_PL = 'pl-8';

export const SIDEBAR_ZONE_HEADER_RIGHT = 'pr-9';

/** Vertical gap between major blocks (New chat, Search, Chat history). */
export const SIDEBAR_OUTER_GAP = 'gap-6';

/** Vertical gap between sections inside history (Topics vs Recent). */
export const SIDEBAR_SECTION_GAP = 'gap-5';

/** Vertical gap between section header and its content. */
export const SIDEBAR_SECTION_HEADER_TO_CONTENT_GAP = 'gap-3';

/**
 * Wrapper for Topics/Recent sections: same padding and rounded corners whether
 * collapsed or expanded, so expand/collapse does not shift layout (no UX jump).
 */
export const SIDEBAR_GROUP_SECTION_WRAPPER =
  'rounded-2xl px-1 py-1.5 transition-colors duration-200 ease-in-out';

/**
 * Full-section background for expanded Groups (Topics) and Recent.
 * Applied only when expanded; wrapper is always applied so layout stays stable.
 */
export const SIDEBAR_GROUP_SECTION_BG_TOPICS =
  'bg-sidebar-foreground/[0.06] dark:bg-sidebar-foreground/[0.09]';

export const SIDEBAR_GROUP_SECTION_BG_RECENT =
  'bg-sidebar-foreground/[0.04] dark:bg-sidebar-foreground/[0.065]';

/** Inner padding for group section content (when expanded). */
export const SIDEBAR_GROUP_SECTION_INNER = 'px-3 pt-1 pb-3';

/** Inner gap within a section. */
export const SIDEBAR_SECTION_INNER_GAP = 'gap-1.5';

export const SIDEBAR_TOPIC_TO_CHILDREN_GAP = 'pt-2';

export const SIDEBAR_TOPIC_ROW_STICKY_TOP = 'top-[2.75rem]';
export const SIDEBAR_TIME_GROUP_ROW_STICKY_TOP = 'top-[5.25rem]';

/** Chat history zone: soft card, rounded-2xl, very subtle background, generous white space. */
export const SIDEBAR_HISTORY_ZONE_BG =
  'bg-sidebar-foreground/[0.02] dark:bg-sidebar-foreground/[0.04] rounded-2xl overflow-hidden border border-sidebar-border/25 dark:border-sidebar-border/40';

export const SIDEBAR_STICKY_HEADER_BG =
  'bg-sidebar-foreground/[0.03] dark:bg-sidebar-foreground/[0.055]';

export const SIDEBAR_STICKY_SECTION_HEADER_BG = 'bg-sidebar';

/** Main "Chat history" header – friendly height, clear typography (14px), confident. */
export const SIDEBAR_SECTION_HEADER =
  'w-full flex shrink-0 items-center justify-between gap-2 h-12 min-h-[3rem] pl-4 pr-2 py-0 rounded-t-2xl transition-colors duration-200 ease-in-out';

export const SIDEBAR_SECTION_HEADER_TITLE =
  'min-w-0 flex-1 truncate text-left text-[14px] font-medium tracking-[0.01em] text-sidebar-foreground/90';

export const SIDEBAR_SECTION_HEADER_DEFAULT = '';

export const SIDEBAR_SECTION_HEADER_HOVER =
  'hover:bg-sidebar-foreground/[0.04] dark:hover:bg-sidebar-foreground/[0.06] hover:text-sidebar-foreground rounded-xl';

export const SIDEBAR_SECTION_HEADER_SELECTED =
  'text-sidebar-foreground rounded-r-2xl bg-sidebar-foreground/[0.06] dark:bg-sidebar-foreground/[0.09] shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary))]';

export const SIDEBAR_SECTION_HEADER_SELECTED_IN_WRAPPER =
  'text-sidebar-foreground rounded-r-2xl bg-sidebar-foreground/[0.06] dark:bg-sidebar-foreground/[0.09]';

export const SIDEBAR_SECTION_HEADER_SELECTED_STICKY =
  'text-sidebar-foreground rounded-r-2xl bg-sidebar shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary))]';

export const SIDEBAR_SECTION_WRAPPER_SELECTED =
  'rounded-2xl shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary)_/_0.75)]';

export const SIDEBAR_SECTION_LEFT_BAR_PADDING = 'pl-[3px]';

/** Topics section: borderless, muted header – one tap target, big-tech clarity. */
export const SIDEBAR_MAJOR_SECTION_HEADER =
  'flex items-center gap-3 w-full h-11 min-h-[2.75rem] pl-4 pr-2 py-0 rounded-xl transition-colors duration-200 ease-in-out font-medium tracking-[0.02em] select-none text-[13px]';

export const SIDEBAR_MAJOR_SECTION_HEADER_DEFAULT = 'text-sidebar-foreground/75';

export const SIDEBAR_MAJOR_SECTION_HEADER_HOVER =
  'hover:bg-sidebar-foreground/[0.05] dark:hover:bg-sidebar-foreground/[0.08] hover:text-sidebar-foreground/95';

/** Recent section: small label (12px); same row height as Topics from SIDEBAR_MAJOR_SECTION_HEADER. */
export const SIDEBAR_MAJOR_SECTION_HEADER_SMALL_LABEL =
  'font-medium tracking-[0.02em] text-sidebar-foreground/60 dark:text-sidebar-foreground/65 text-[12px]';

/** Group/topic row – same height as thread rows (2.75rem), 13px, comfortable tap target. */
export const SIDEBAR_GROUP_ROW =
  'flex w-full items-center gap-3 py-2.5 pl-4 pr-2 min-h-[2.75rem] font-medium tracking-[0.02em] transition-colors duration-200 ease-in-out rounded-xl select-none text-[13px]';

export const SIDEBAR_GROUP_ROW_DEFAULT = 'text-sidebar-foreground/88 bg-transparent';

export const SIDEBAR_ROW_BG =
  'bg-transparent hover:bg-sidebar-foreground/[0.05] dark:hover:bg-sidebar-foreground/[0.07]';

export const SIDEBAR_GROUP_ROW_BG = SIDEBAR_ROW_BG;

/** Selected state: teal/primary left bar, soft background – NBC active state. */
export const SIDEBAR_GROUP_ROW_SELECTED =
  'text-sidebar-foreground rounded-r-xl bg-sidebar-foreground/[0.07] dark:bg-sidebar-foreground/[0.11] shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary))]';

export const SIDEBAR_GROUP_ROW_SELECTED_STICKY =
  'text-sidebar-foreground rounded-r-xl bg-sidebar shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary))]';

export const SIDEBAR_GROUP_ROW_STICKY =
  'sticky z-[5] bg-sidebar transition-colors duration-200 ease-in-out';

export const SIDEBAR_TIME_GROUP_ROW_STICKY =
  'sticky z-[1] bg-sidebar transition-colors duration-200 ease-in-out';

/** Time group label (Today, Yesterday…): 12px, muted; row height from SIDEBAR_GROUP_ROW. */
export const SIDEBAR_TIME_GROUP_ROW =
  'text-sidebar-foreground/55 dark:text-sidebar-foreground/60 font-medium tracking-[0.02em] text-[12px]';

export const SIDEBAR_TIME_GROUP_ROW_WRAPPER = 'rounded-xl';

/** Thread item: same row height as topic (2.75rem), 13px, comfortable tap target. */
export const SIDEBAR_THREAD_ITEM_PADDING =
  'rounded-xl pl-4 pr-2 py-2.5 min-h-[2.75rem] my-0.5';
export const SIDEBAR_THREAD_ITEM_TEXT =
  'truncate text-left tracking-[0.01em] text-[13px]';

export const SIDEBAR_THREAD_ITEM_DEFAULT =
  'text-sidebar-foreground/90 bg-transparent';

export const SIDEBAR_THREAD_ITEM_HOVER =
  'hover:bg-sidebar-foreground/[0.05] dark:hover:bg-sidebar-foreground/[0.08]';

export const SIDEBAR_THREAD_ITEM_ACTIVE =
  'rounded-r-xl bg-sidebar-foreground/[0.08] dark:bg-sidebar-foreground/[0.12] text-sidebar-foreground font-medium shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary))]';

export const SIDEBAR_THREAD_ITEM_OPEN =
  'bg-sidebar-foreground/[0.05] dark:bg-sidebar-foreground/[0.08]';

export const SIDEBAR_GROUP_ICON_SIZE = 'h-4 w-4';
export const SIDEBAR_THREAD_ICON_SIZE = 'h-4 w-4';

export const SIDEBAR_GROUP_BLOCK_PADDING = 'py-2';

export const SIDEBAR_GROUP_BLOCK_SELECTED = '';

/** Primary CTA (New chat): solid Deep Blue / Teal, subtle hover glow. */
export const SIDEBAR_CTA_PRIMARY =
  'w-full justify-between gap-3 h-12 min-h-12 pl-5 pr-3.5 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-95 hover:shadow-[0_4px_16px_hsl(var(--sidebar-primary)_/_0.3)] active:scale-[0.98] transition-all duration-200 ease-in-out font-medium tracking-wide focus-visible:ring-2 focus-visible:ring-sidebar-primary focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar outline-none shadow-sm text-[14px]';

/** Secondary action (Search): soft background, no heavy border. */
export const SIDEBAR_ACTION_SECONDARY =
  'w-full justify-between gap-2.5 h-11 min-h-11 pl-4 pr-3.5 rounded-xl bg-sidebar-foreground/[0.04] dark:bg-sidebar-foreground/[0.08] border border-transparent text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-foreground/[0.07] dark:hover:bg-sidebar-foreground/[0.11] transition-colors duration-200 ease-in-out font-medium tracking-wide focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar outline-none text-[13px]';

/** Create-group / secondary action in Topics. */
export const SIDEBAR_ACTION_BUTTON =
  'w-full justify-start gap-3 h-10 min-h-10 pl-4 pr-2 rounded-xl text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-foreground/[0.05] dark:hover:bg-sidebar-foreground/[0.09] transition-colors duration-200 ease-in-out font-medium tracking-wide focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar outline-none text-[13px]';

/** Count badge: pill shape, subtle – unified label size. */
export const SIDEBAR_GROUP_COUNT_BADGE =
  'inline-flex items-center justify-center font-medium tabular-nums rounded-full px-2.5 py-0.5 min-w-[1.25rem] transition-colors duration-200 text-[12px]';

export const SIDEBAR_GROUP_COUNT_BADGE_DEFAULT =
  'text-sidebar-foreground/50 bg-sidebar-foreground/[0.08] dark:bg-sidebar-foreground/[0.12]';

export const SIDEBAR_GROUP_COUNT_BADGE_SELECTED =
  'bg-sidebar-foreground/15 dark:bg-sidebar-foreground/2 text-sidebar-foreground/90';

export const SIDEBAR_FOCUS_RING =
  'outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar';

/** Icon button (ellipsis, collapse). */
export const SIDEBAR_ICON_BUTTON =
  'flex items-center justify-center h-9 w-9 rounded-xl text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-foreground/[0.06] dark:hover:bg-sidebar-foreground/[0.09] transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar';

/** Dropdown menu item (sidebar context). */
export const SIDEBAR_MENU_ITEM =
  'rounded-xl py-2.5 cursor-pointer text-[13px]';

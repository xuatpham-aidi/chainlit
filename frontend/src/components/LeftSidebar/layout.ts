/**
 * Left sidebar chat history – NBC style (big-tech, friendly, addictive).
 * @see enbc/db_ignore/nbc_style.md
 *
 * Design principles:
 * - Rounded corners 10–14px, soft cards, no harsh edges.
 * - Generous spacing, balanced padding/margin, clear hierarchy.
 * - Smooth ease-in-out transitions, subtle hover elevation.
 * - Block A: New chat (solid Deep Blue/Teal) + Search (soft). Block B: Topics + Recent.
 *
 * Spacing scale: 8px, 12px, 16px, 20px, 24px, 32px.
 */

/** Horizontal padding for sidebar content (aligns list items and headers). */
export const SIDEBAR_CONTENT_PX = 'px-4';

/** Indentation for hierarchy: level 0 = topic/section, level 1 = time group, level 2 = thread under topic. */
export const SIDEBAR_LEVEL_0_PL = 'pl-4';
export const SIDEBAR_LEVEL_1_PL = 'pl-6';
export const SIDEBAR_LEVEL_2_PL = 'pl-8';

export const SIDEBAR_ZONE_HEADER_RIGHT = 'pr-9';

/** Vertical gap between major blocks (New chat, Search, Chat history). */
export const SIDEBAR_OUTER_GAP = 'gap-5';

/** Vertical gap between sections inside history (Topics vs Recent). */
export const SIDEBAR_SECTION_GAP = 'gap-6';

/** Vertical gap between section header and its content. */
export const SIDEBAR_SECTION_HEADER_TO_CONTENT_GAP = 'gap-4';

/** Inner gap within a section. */
export const SIDEBAR_SECTION_INNER_GAP = 'gap-3';

export const SIDEBAR_TOPIC_TO_CHILDREN_GAP = 'pt-3';

export const SIDEBAR_TOPIC_ROW_STICKY_TOP = 'top-[2.75rem]';
export const SIDEBAR_TIME_GROUP_ROW_STICKY_TOP = 'top-[5.25rem]';

/** Chat history zone: soft card, rounded-2xl, very subtle background. */
export const SIDEBAR_HISTORY_ZONE_BG =
  'bg-sidebar-foreground/[0.04] dark:bg-sidebar-foreground/[0.07] rounded-2xl overflow-hidden';

export const SIDEBAR_STICKY_HEADER_BG =
  'bg-sidebar-foreground/[0.04] dark:bg-sidebar-foreground/[0.07]';

export const SIDEBAR_STICKY_SECTION_HEADER_BG = 'bg-sidebar';

/** Main "Chat history" header inside zone – friendly height, clear typography. Right padding matches Search bar so icons align. */
export const SIDEBAR_SECTION_HEADER =
  'w-full flex shrink-0 items-center justify-between gap-2 h-12 min-h-[3rem] pl-4 pr-3.5 py-0 rounded-t-2xl transition-colors duration-200 ease-in-out';

export const SIDEBAR_SECTION_HEADER_TITLE =
  'min-w-0 flex-1 truncate text-left text-[13px] font-medium tracking-wide text-sidebar-foreground/80';

export const SIDEBAR_SECTION_HEADER_DEFAULT = '';

export const SIDEBAR_SECTION_HEADER_HOVER =
  'hover:bg-sidebar-foreground/[0.06] hover:text-sidebar-foreground rounded-xl';

export const SIDEBAR_SECTION_HEADER_SELECTED =
  'text-sidebar-foreground rounded-r-2xl bg-sidebar-foreground/[0.07] dark:bg-sidebar-foreground/[0.1] shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary))]';

export const SIDEBAR_SECTION_HEADER_SELECTED_IN_WRAPPER =
  'text-sidebar-foreground rounded-r-2xl bg-sidebar-foreground/[0.07] dark:bg-sidebar-foreground/[0.1]';

export const SIDEBAR_SECTION_HEADER_SELECTED_STICKY =
  'text-sidebar-foreground rounded-r-2xl bg-sidebar shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary))]';

export const SIDEBAR_SECTION_WRAPPER_SELECTED =
  'rounded-2xl shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary)_/_0.75)]';

export const SIDEBAR_SECTION_LEFT_BAR_PADDING = 'pl-[3px]';

/** Major section (Topics / Recent): one tap target, friendly height. */
export const SIDEBAR_MAJOR_SECTION_HEADER =
  'flex items-center gap-3 w-full h-12 min-h-[3rem] pl-4 pr-3 py-0 rounded-2xl transition-colors duration-200 ease-in-out text-[13px] font-medium tracking-wide';

export const SIDEBAR_MAJOR_SECTION_HEADER_DEFAULT = 'text-sidebar-foreground/78';

export const SIDEBAR_MAJOR_SECTION_HEADER_HOVER =
  'hover:bg-sidebar-foreground/[0.06] hover:text-sidebar-foreground';

/** Group/topic row base – comfortable tap target. */
export const SIDEBAR_GROUP_ROW =
  'flex w-full items-center gap-3 py-2.5 pl-4 pr-3 min-h-[2.75rem] text-[13px] font-medium tracking-wide transition-colors duration-200 ease-in-out rounded-2xl';

export const SIDEBAR_GROUP_ROW_DEFAULT = 'text-sidebar-foreground/88 bg-transparent';

export const SIDEBAR_ROW_BG =
  'bg-transparent hover:bg-sidebar-foreground/[0.06] dark:hover:bg-sidebar-foreground/[0.08]';

export const SIDEBAR_GROUP_ROW_BG = SIDEBAR_ROW_BG;

export const SIDEBAR_GROUP_ROW_SELECTED =
  'text-sidebar-foreground rounded-r-2xl bg-sidebar-foreground/[0.08] dark:bg-sidebar-foreground/[0.12] shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary))]';

export const SIDEBAR_GROUP_ROW_SELECTED_STICKY =
  'text-sidebar-foreground rounded-r-2xl bg-sidebar shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary))]';

export const SIDEBAR_GROUP_ROW_STICKY =
  'sticky z-[5] bg-sidebar transition-colors duration-200 ease-in-out';

export const SIDEBAR_TIME_GROUP_ROW_STICKY =
  'sticky z-[1] bg-sidebar transition-colors duration-200 ease-in-out';

export const SIDEBAR_TIME_GROUP_ROW =
  'text-sidebar-foreground/65 text-[12px] font-medium tracking-wide';

export const SIDEBAR_TIME_GROUP_ROW_WRAPPER = 'rounded-2xl';

/** Thread item: comfortable tap target, rounded, clear hierarchy. */
export const SIDEBAR_THREAD_ITEM_PADDING =
  'rounded-2xl pl-4 pr-3 py-2.5 min-h-[2.75rem] my-0.5';
export const SIDEBAR_THREAD_ITEM_TEXT =
  'truncate text-left text-[13px] tracking-wide';

export const SIDEBAR_THREAD_ITEM_DEFAULT =
  'text-sidebar-foreground/90 bg-transparent';

export const SIDEBAR_THREAD_ITEM_HOVER =
  'hover:bg-sidebar-foreground/[0.06] dark:hover:bg-sidebar-foreground/[0.09]';

export const SIDEBAR_THREAD_ITEM_ACTIVE =
  'rounded-r-2xl bg-sidebar-foreground/[0.1] dark:bg-sidebar-foreground/[0.14] text-sidebar-foreground font-medium shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary))]';

export const SIDEBAR_THREAD_ITEM_OPEN =
  'bg-sidebar-foreground/[0.06] dark:bg-sidebar-foreground/[0.09]';

export const SIDEBAR_GROUP_ICON_SIZE = 'h-4 w-4';
export const SIDEBAR_THREAD_ICON_SIZE = 'h-4 w-4';

export const SIDEBAR_GROUP_BLOCK_PADDING = 'py-2.5';

export const SIDEBAR_GROUP_BLOCK_SELECTED = '';

/** Primary CTA (New chat): solid Deep Blue / Teal, subtle hover glow. Icon aligned with Search and Collapse icons (pr-3.5). */
export const SIDEBAR_CTA_PRIMARY =
  'w-full justify-between gap-3 h-12 min-h-12 pl-5 pr-3.5 rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-92 hover:shadow-[0_4px_14px_hsl(var(--sidebar-primary)_/_0.25)] active:scale-[0.98] transition-all duration-200 ease-in-out text-[14px] font-medium tracking-wide focus-visible:ring-2 focus-visible:ring-sidebar-primary focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar outline-none shadow-sm';

/** Secondary action (Search): soft background, no heavy border, inviting. */
export const SIDEBAR_ACTION_SECONDARY =
  'w-full justify-between gap-2.5 h-11 min-h-11 pl-4 pr-3.5 rounded-2xl bg-sidebar-foreground/[0.05] dark:bg-sidebar-foreground/[0.09] border border-transparent text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-foreground/[0.08] dark:hover:bg-sidebar-foreground/[0.12] transition-colors duration-200 ease-in-out text-[13px] font-medium tracking-wide focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar outline-none';

/** Create-group / secondary action button in Topics section. */
export const SIDEBAR_ACTION_BUTTON =
  'w-full justify-start gap-3 h-11 min-h-11 pl-4 pr-3 rounded-2xl text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-foreground/[0.06] dark:hover:bg-sidebar-foreground/[0.1] transition-colors duration-200 ease-in-out text-[13px] font-medium tracking-wide focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar outline-none';

/** Count badge in collapsible group row (pill shape). */
export const SIDEBAR_GROUP_COUNT_BADGE =
  'inline-flex items-center justify-center text-[11px] font-medium tabular-nums rounded-full px-2.5 py-0.5 min-w-[1.25rem] transition-colors duration-200';

export const SIDEBAR_GROUP_COUNT_BADGE_DEFAULT =
  'text-sidebar-foreground/60 bg-sidebar-foreground/[0.1] dark:bg-sidebar-foreground/[0.14]';

export const SIDEBAR_GROUP_COUNT_BADGE_SELECTED =
  'bg-sidebar-foreground/15 dark:bg-sidebar-foreground/20 text-sidebar-foreground/95';

export const SIDEBAR_FOCUS_RING =
  'outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar';

/** Icon button (ellipsis, collapse): consistent hover/active. */
export const SIDEBAR_ICON_BUTTON =
  'flex items-center justify-center h-9 w-9 rounded-2xl text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-foreground/[0.07] dark:hover:bg-sidebar-foreground/[0.1] transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar';

/** Dropdown menu item (sidebar context). */
export const SIDEBAR_MENU_ITEM =
  'rounded-xl py-2.5 cursor-pointer';

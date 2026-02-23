/**
 * Shared types for LeftSidebar chat history.
 * Re-export or extend from @chainlit/react-client where applicable.
 */

import type { ThreadHistory as ClientThreadHistory } from '@chainlit/react-client';

export type { IThread } from '@chainlit/react-client';

/** Thread history shape from API/client; alias for clarity in sidebar. */
export type ThreadHistoryData = ClientThreadHistory;

export interface ChatHistorySectionProps {
  historyScrollRef: React.RefObject<HTMLDivElement | null>;
  onHistoryScroll?: () => void;
  registerScrollHandler?: (handler: (() => void) | null) => void;
  collapsedGroups: Set<string> | null;
  setCollapsedGroups: React.Dispatch<React.SetStateAction<Set<string> | null>>;
  onCollapseAll: () => void;
  hideScrollbar: boolean;
  threadsFilter: (thread: { groupId?: string | null }) => boolean;
  ungroupedSectionTitle?: string;
  hasUncollapsedRecentGroups?: boolean;
}

export interface ThreadHistoryProps {
  historyScrollRef?: React.RefObject<HTMLDivElement | null>;
  registerScrollHandler?: (handler: (() => void) | null) => void;
  collapsedGroups: Set<string> | null;
  setCollapsedGroups: React.Dispatch<React.SetStateAction<Set<string> | null>>;
  hideScrollbar?: boolean;
  showCollapseButton?: boolean;
  onCollapseAll?: () => void;
  threadsFilter?: (thread: { groupId?: string | null }) => boolean;
  sectionTitle?: React.ReactNode;
  sectionExpanded?: boolean;
  onSectionExpandedChange?: (expanded: boolean) => void;
}

export interface ThreadListProps {
  threadHistory?: ThreadHistoryData;
  error?: string;
  isFetching: boolean;
  isLoadingMore: boolean;
  collapsedGroups: Set<string> | null;
  setCollapsedGroups: React.Dispatch<React.SetStateAction<Set<string> | null>>;
  stickyTopOffset?: string;
  compactFirstGroup?: boolean;
  folderTreeStyle?: boolean;
}

export interface GroupedChatSectionProps {
  sectionExpanded?: boolean;
  onSectionExpandedChange?: (expanded: boolean) => void;
  expandedGroups?: Set<string>;
  onExpandedGroupsChange?: (set: React.SetStateAction<Set<string>>) => void;
}

/** Topic/group row as used in Grouped chat (Topics). */
export interface ThreadGroupRecord {
  id: string;
  userId: string;
  name: string;
  displayOrder: number;
  createdAt?: string;
}

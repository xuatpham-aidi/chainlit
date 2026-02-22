import { useCallback, useRef } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import {
  sidebarTopicsSectionExpandedState,
  sidebarRecentSectionExpandedState,
  sidebarTopicGroupExpandedState,
  sidebarGroupTimeGroupCollapsedState
} from '@/state/sidebar';

import { CustomScrollbar } from '@/components/CustomScrollbar';

import { Translator } from '../i18n';
import { ThreadCollapseButton } from './ThreadCollapse';
import { GroupedChatSection } from './GroupedChatSection';
import { ThreadHistory } from './ThreadHistory';

export interface ChatHistorySectionProps {
  historyScrollRef: React.RefObject<HTMLDivElement | null>;
  onHistoryScroll?: () => void;
  registerScrollHandler?: (handler: (() => void) | null) => void;
  collapsedGroups: Set<string> | null;
  setCollapsedGroups: React.Dispatch<
    React.SetStateAction<Set<string> | null>
  >;
  onCollapseAll: () => void;
  hideScrollbar: boolean;
  threadsFilter: (thread: { groupId?: string | null }) => boolean;
  ungroupedSectionTitle?: string;
  hasUncollapsedRecentGroups?: boolean;
}

const DEFAULT_UNGROUPED_TITLE = 'threadHistory.sidebar.recent';

export function ChatHistorySection({
  historyScrollRef,
  onHistoryScroll,
  collapsedGroups,
  setCollapsedGroups,
  onCollapseAll,
  hideScrollbar,
  threadsFilter,
  ungroupedSectionTitle = DEFAULT_UNGROUPED_TITLE,
  hasUncollapsedRecentGroups = false
}: ChatHistorySectionProps) {
  const [topicsExpanded, setTopicsExpanded] = useRecoilState(
    sidebarTopicsSectionExpandedState
  );
  const [recentExpanded, setRecentExpanded] = useRecoilState(
    sidebarRecentSectionExpandedState
  );
  const [expandedGroupsInSection, setExpandedGroupsInSection] = useRecoilState(
    sidebarTopicGroupExpandedState
  );
  const groupTimeGroupCollapsed = useRecoilValue(
    sidebarGroupTimeGroupCollapsedState
  );

  const groupTimeGroupKey = Object.entries(groupTimeGroupCollapsed ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([groupId, set]) =>
        `${groupId}:${set ? Array.from(set).sort().join(',') : 'n'}`
    )
    .join(';');

  const invalidateKey = [
    topicsExpanded ? '1' : '0',
    recentExpanded ? '1' : '0',
    expandedGroupsInSection ? Array.from(expandedGroupsInSection).sort().join(',') : '',
    collapsedGroups ? Array.from(collapsedGroups).sort().join(',') : '',
    groupTimeGroupKey
  ].join('|');

  const showCollapseButton =
    (topicsExpanded && expandedGroupsInSection.size > 0) ||
    (recentExpanded && hasUncollapsedRecentGroups);

  const handleCollapseAll = useCallback(() => {
    onCollapseAll();
  }, [onCollapseAll]);

  const registeredScrollHandlerRef = useRef<(() => void) | null>(null);
  const registerThreadHistoryScroll = useCallback((handler: (() => void) | null) => {
    registeredScrollHandlerRef.current = handler;
  }, []);
  const handleHistoryScroll = useCallback(() => {
    onHistoryScroll?.();
    registeredScrollHandlerRef.current?.();
  }, [onHistoryScroll]);

  return (
    <div className="flex flex-1 flex-col min-h-0" aria-label="Chat history">
      <header className="flex shrink-0 items-center justify-between pb-2 pr-1">
        <p className="min-w-0 flex-1 truncate text-left text-xs font-medium text-sidebar-foreground/60 tracking-tight">
          <Translator path="threadHistory.sidebar.title" />
        </p>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center">
          <ThreadCollapseButton
            visible
            onCollapseAll={handleCollapseAll}
            disabled={!showCollapseButton}
          />
        </div>
      </header>
      <CustomScrollbar
        ref={historyScrollRef}
        onScroll={handleHistoryScroll}
        className="flex-1 min-h-0"
        variant="sidebar"
        hideScrollbar={hideScrollbar}
        invalidateKey={invalidateKey}
      >
        <div className="flex flex-col gap-0 px-0 min-h-0">
          <GroupedChatSection
            sectionExpanded={topicsExpanded}
            onSectionExpandedChange={setTopicsExpanded}
            expandedGroups={expandedGroupsInSection}
            onExpandedGroupsChange={setExpandedGroupsInSection}
          />
          <ThreadHistory
            historyScrollRef={historyScrollRef}
            registerScrollHandler={registerThreadHistoryScroll}
            collapsedGroups={collapsedGroups}
            setCollapsedGroups={setCollapsedGroups}
            threadsFilter={threadsFilter}
            sectionTitle={ungroupedSectionTitle}
            hideScrollbar={hideScrollbar}
            showCollapseButton={recentExpanded}
            onCollapseAll={onCollapseAll}
            sectionExpanded={recentExpanded}
            onSectionExpandedChange={setRecentExpanded}
          />
        </div>
      </CustomScrollbar>
    </div>
  );
}

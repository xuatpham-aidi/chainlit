import { useCallback, useRef } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import {
  sidebarTopicsSectionExpandedState,
  sidebarRecentSectionExpandedState,
  sidebarTopicGroupExpandedState,
  sidebarGroupTimeGroupCollapsedState
} from '@/state/sidebar';

import { CustomScrollbar } from '@/components/CustomScrollbar';

import { cn } from '@/lib/utils';
import {
  SIDEBAR_SECTION_HEADER,
  SIDEBAR_SECTION_HEADER_TITLE,
  SIDEBAR_SECTION_HEADER_HOVER,
  SIDEBAR_SECTION_GAP,
  SIDEBAR_CONTENT_PX,
  SIDEBAR_HISTORY_ZONE_BG,
  SIDEBAR_ZONE_HEADER_RIGHT
} from './layout';
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

  const hasUncollapsedChildren =
    (topicsExpanded && expandedGroupsInSection.size > 0) ||
    (recentExpanded && hasUncollapsedRecentGroups);
  const showCollapseButton = topicsExpanded || recentExpanded;

  const handleCollapseAll = useCallback(() => {
    if (hasUncollapsedChildren) {
      setExpandedGroupsInSection(new Set());
      onCollapseAll();
    } else {
      setTopicsExpanded(false);
      setRecentExpanded(false);
    }
  }, [
    hasUncollapsedChildren,
    onCollapseAll,
    setTopicsExpanded,
    setRecentExpanded,
    setExpandedGroupsInSection
  ]);

  const registeredScrollHandlerRef = useRef<(() => void) | null>(null);
  const registerThreadHistoryScroll = useCallback((handler: (() => void) | null) => {
    registeredScrollHandlerRef.current = handler;
  }, []);
  const handleHistoryScroll = useCallback(() => {
    onHistoryScroll?.();
    registeredScrollHandlerRef.current?.();
  }, [onHistoryScroll]);

  return (
    <div className="flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden" aria-label="Chat history">
      <div
        className={cn(
          'flex flex-1 flex-col min-h-0 min-w-0 rounded-2xl overflow-hidden',
          SIDEBAR_HISTORY_ZONE_BG
        )}
      >
        <header
          className={cn(SIDEBAR_SECTION_HEADER, SIDEBAR_SECTION_HEADER_HOVER)}
        >
          <p className={SIDEBAR_SECTION_HEADER_TITLE}>
            <Translator path="threadHistory.sidebar.title" />
          </p>
          <div className="flex h-9 w-9 shrink-0 items-center justify-end">
            <ThreadCollapseButton
              visible
              onCollapseAll={handleCollapseAll}
              disabled={!showCollapseButton}
              alignIcon="end"
            />
          </div>
        </header>
        <CustomScrollbar
          ref={historyScrollRef}
          onScroll={handleHistoryScroll}
          className="flex-1 min-h-0 min-w-0"
          variant="sidebar"
          hideScrollbar={hideScrollbar}
          invalidateKey={invalidateKey}
        >
          <div
            className={cn(
              'flex flex-1 flex-col min-h-0 min-w-0 py-5',
              SIDEBAR_SECTION_GAP,
              SIDEBAR_CONTENT_PX
            )}
          >
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
    </div>
  );
}

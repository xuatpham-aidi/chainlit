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
  SIDEBAR_GROUP_CONTENT_PX,
  SIDEBAR_HISTORY_ZONE_BG,
  SIDEBAR_INNER_SECTION_SEPARATOR,
  SIDEBAR_SECTION_HEADER_BORDER,
  SIDEBAR_LIST_GAP_BG
} from './layout';
import { Translator } from '../i18n';
import { ThreadCollapseButton } from './ThreadCollapse';
import { GroupedChatSection } from './GroupedChatSection';
import { ThreadHistory } from './ThreadHistory';
import type { ChatHistorySectionProps } from './types';

export type { ChatHistorySectionProps } from './types';

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
          className={cn(
            SIDEBAR_SECTION_HEADER,
            SIDEBAR_SECTION_HEADER_HOVER,
            'select-none',
            SIDEBAR_SECTION_HEADER_BORDER
          )}
        >
          <p className={SIDEBAR_SECTION_HEADER_TITLE}>
            <Translator path="threadHistory.sidebar.title" />
          </p>
          <div
            className="flex h-7 w-7 min-w-7 shrink-0 items-center justify-end"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            role="presentation"
          >
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
              'flex flex-1 flex-col min-h-0 min-w-0 py-2',
              SIDEBAR_GROUP_CONTENT_PX,
              SIDEBAR_LIST_GAP_BG
            )}
          >
            <GroupedChatSection
              sectionExpanded={topicsExpanded}
              onSectionExpandedChange={setTopicsExpanded}
              expandedGroups={expandedGroupsInSection}
              onExpandedGroupsChange={setExpandedGroupsInSection}
            />
            <div
              className={cn('flex flex-col flex-1 min-h-0 min-w-0 pt-3', SIDEBAR_INNER_SECTION_SEPARATOR)}
            >
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
          </div>
        </CustomScrollbar>
      </div>
    </div>
  );
}

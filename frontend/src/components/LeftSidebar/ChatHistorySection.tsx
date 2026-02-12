import { useCallback, useState } from 'react';
import { useRecoilValue } from 'recoil';

import { CustomScrollbar } from '@/components/CustomScrollbar';
import { Loader } from '@/components/Loader';
import { threadListLoadingState } from '@/state/project';

import { Translator } from '../i18n';
import { ThreadCollapseButton } from './ThreadCollapse';
import { GroupedChatSection } from './GroupedChatSection';
import { ThreadHistory } from './ThreadHistory';

export interface ChatHistorySectionProps {
  historyScrollRef: React.RefObject<HTMLDivElement | null>;
  onHistoryScroll: () => void;
  registerScrollHandler?: (handler: (() => void) | null) => void;
  collapsedGroups: Set<string> | null;
  setCollapsedGroups: React.Dispatch<
    React.SetStateAction<Set<string> | null>
  >;
  onCollapseAll: () => void;
  hideScrollbar: boolean;
  invalidateKey: string;
  threadsFilter: (thread: { groupId?: string | null }) => boolean;
  ungroupedSectionTitle?: string;
}

const DEFAULT_UNGROUPED_TITLE = 'threadHistory.sidebar.recent';

export function ChatHistorySection({
  historyScrollRef,
  onHistoryScroll,
  registerScrollHandler,
  collapsedGroups,
  setCollapsedGroups,
  onCollapseAll,
  hideScrollbar,
  invalidateKey,
  threadsFilter,
  ungroupedSectionTitle = DEFAULT_UNGROUPED_TITLE
}: ChatHistorySectionProps) {
  const [topicsExpanded, setTopicsExpanded] = useState(true);
  const [recentExpanded, setRecentExpanded] = useState(true);
  const [expandedGroupsInSection, setExpandedGroupsInSection] = useState<
    Set<string>
  >(new Set());
  const listLoading = useRecoilValue(threadListLoadingState);
  const isLoading = listLoading?.isFetching || listLoading?.isLoadingMore;
  const showCollapseButton = topicsExpanded || recentExpanded;

  const handleCollapseAll = useCallback(() => {
    setExpandedGroupsInSection(new Set());
    onCollapseAll();
  }, [onCollapseAll]);

  return (
    <div className="flex flex-1 flex-col min-h-0" aria-label="Chat history">
      <header className="flex shrink-0 items-center justify-between gap-2 pb-2 px-0">
        <p className="min-w-0 flex-1 truncate text-left text-xs font-medium text-sidebar-foreground/60 tracking-tight">
          <Translator path="threadHistory.sidebar.title" />
        </p>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center">
          {isLoading ? (
            <Loader />
          ) : showCollapseButton ? (
            <ThreadCollapseButton visible onCollapseAll={handleCollapseAll} />
          ) : (
            <span className="size-4 shrink-0" aria-hidden />
          )}
        </div>
      </header>
      <CustomScrollbar
        ref={historyScrollRef}
        onScroll={onHistoryScroll}
        className="flex-1 min-h-0"
        variant="sidebar"
        hideScrollbar={hideScrollbar}
        invalidateKey={invalidateKey}
      >
        <div className="flex flex-col gap-4 px-0 min-h-0">
          <GroupedChatSection
            sectionExpanded={topicsExpanded}
            onSectionExpandedChange={setTopicsExpanded}
            expandedGroups={expandedGroupsInSection}
            onExpandedGroupsChange={setExpandedGroupsInSection}
          />
          <ThreadHistory
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

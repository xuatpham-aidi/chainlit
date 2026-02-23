import { uniqBy } from 'lodash';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';

import {
  ChainlitContext,
  IThread,
  threadHistoryState,
  useChatMessages
} from '@chainlit/react-client';
import { groupByDate } from '@chainlit/react-client';

import { threadListLoadingState } from '@/state/project';
import { cn } from '@/lib/utils';

import {
  SidebarContent,
  SidebarGroupContent,
  SidebarMenu
} from '@/components/ui/sidebar';

import { Loader } from '@/components/Loader';

import {
  SIDEBAR_SECTION_HEADER,
  SIDEBAR_SECTION_HEADER_TITLE,
  SIDEBAR_SECTION_HEADER_HOVER,
  SIDEBAR_SECTION_GAP,
  SIDEBAR_SECTION_INNER_GAP,
  SIDEBAR_LIST_GAP_BG,
  SIDEBAR_RECENT_LIST_STICKY_TOP
} from './layout';
import { Translator } from '../i18n';
import { ThreadCollapseButton } from './ThreadCollapse';
import { ThreadList } from './ThreadList';
import { SidebarSection } from './SidebarSection';
import type { ThreadHistoryProps } from './types';
import {
  MAX_THREAD_NAME_LENGTH,
  LIST_PAGINATION,
  BATCH_FETCH_DELAY_MS
} from './constants';

let scrollTopCache = 0;

export function ThreadHistory({
  historyScrollRef: historyScrollRefProp,
  registerScrollHandler,
  collapsedGroups,
  setCollapsedGroups,
  hideScrollbar = false,
  showCollapseButton = false,
  onCollapseAll,
  threadsFilter,
  sectionTitle,
  sectionExpanded: sectionExpandedProp,
  onSectionExpandedChange
}: ThreadHistoryProps) {
  const [internalSectionExpanded, setInternalSectionExpanded] = useState(true);
  const sectionExpanded =
    sectionExpandedProp !== undefined
      ? sectionExpandedProp
      : internalSectionExpanded;
  const setSectionExpanded =
    onSectionExpandedChange !== undefined
      ? (v: boolean) => onSectionExpandedChange(v)
      : setInternalSectionExpanded;
  const useChevronToggle =
    sectionExpandedProp !== undefined && onSectionExpandedChange !== undefined;
  const navigate = useNavigate();
  const scrollRef = historyScrollRefProp;
  const apiClient = useContext(ChainlitContext);
  const { firstInteraction, messages, threadId } = useChatMessages();
  const [threadHistory, setThreadHistory] = useRecoilState(threadHistoryState);
  const [listLoading, setListLoading] = useRecoilState(threadListLoadingState);
  const { isFetching, isLoadingMore } = listLoading;
  const [error, setError] = useState<string>();
  const [shouldLoadMore, setShouldLoadMore] = useState(false);
  const initialLoadActiveRef = useRef(false);

  const setListLoadingFlag = (key: 'isFetching' | 'isLoadingMore', value: boolean) =>
    setListLoading((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = scrollTopCache;
  }, []);

  // On first interaction (new chat): prepend a stub thread so the sidebar shows it
  // without refetching the list. No API call; timeGroupedThreads is derived from threads.
  const prependNewThreadStub = useCallback(() => {
    if (!threadId) return;
    setThreadHistory((prev) => {
      const prevThreads = prev?.threads ?? [];
      if (prevThreads.some((t) => t.id === threadId)) return prev;
      const stub: IThread = {
        id: threadId,
        createdAt: new Date().toISOString(),
        steps: []
      };
      return {
        ...prev,
        currentThreadId: threadId,
        threads: [stub, ...prevThreads]
      };
    });
  }, [threadId, setThreadHistory]);

  // Handle first interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!firstInteraction) return;

      const isActualResume =
        firstInteraction === 'resume' &&
        messages[0]?.output.toLowerCase() !== 'resume';

      if (isActualResume) return;

      prependNewThreadStub();

      const currentPage = new URL(window.location.href);
      if (threadId && currentPage.pathname === '/') {
        navigate(`/thread/${threadId}`);
      }
    };

    handleFirstInteraction();
  }, [firstInteraction, prependNewThreadStub, threadId, messages, navigate]);

  // Update current thread name from first user message so the sidebar shows it without reload
  useEffect(() => {
    if (!threadId || !messages?.length) return;
    const firstUserMessage = messages.find(
      (m) => m.type === 'user_message' && (m.output || m.input)
    );
    const titleSource = firstUserMessage?.output ?? firstUserMessage?.input;
    if (!titleSource || typeof titleSource !== 'string') return;
    const truncated =
      titleSource.length > MAX_THREAD_NAME_LENGTH
        ? titleSource.slice(0, MAX_THREAD_NAME_LENGTH).trim() + '...'
        : titleSource.trim();
    if (!truncated) return;
    setThreadHistory((prev) => {
      const threads = prev?.threads ?? [];
      const match = threads.find((t) => t.id === threadId);
      if (!match || (match.name && match.name.length > 0)) return prev;
      return {
        ...prev,
        threads: threads.map((t) =>
          t.id === threadId ? { ...t, name: truncated } : t
        )
      };
    });
  }, [threadId, messages, setThreadHistory]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollHeight, clientHeight, scrollTop } = el;
    scrollTopCache = scrollTop;
    setShouldLoadMore(scrollTop + clientHeight >= scrollHeight - 10);
  }, [scrollRef]);

  useEffect(() => {
    if (!registerScrollHandler) return;
    registerScrollHandler(handleScroll);
    return () => registerScrollHandler(null);
  }, [registerScrollHandler, handleScroll]);

  const fetchThreads = async (
    cursor?: string | number,
    isLoadingMore = false
  ) => {
    const isInitialLoad = !cursor && !isLoadingMore;
    const isInitialContinuation = cursor !== undefined && initialLoadActiveRef.current;

    if (isInitialLoad) {
      initialLoadActiveRef.current = true;
      setListLoadingFlag('isFetching', true);
    } else if (cursor && !initialLoadActiveRef.current) {
      setListLoadingFlag('isLoadingMore', true);
    } else if (!cursor && isLoadingMore) {
      setListLoadingFlag('isLoadingMore', true);
    }

    let willContinueInitial = false;

    try {
      const first =
        isInitialLoad ? LIST_PAGINATION.initialBatch : LIST_PAGINATION.batchSize;
      const { pageInfo, data } = await apiClient.listThreads(
        { first, cursor },
        {}
      );

      setError(undefined);

      setThreadHistory((prev) => {
        const prevThreads = prev?.threads ?? [];
        const merged = uniqBy(
          cursor ? prevThreads.concat(data) : data,
          'id'
        );
        return { ...prev, pageInfo, threads: merged };
      });

      willContinueInitial =
        initialLoadActiveRef.current &&
        Boolean(pageInfo?.hasNextPage && pageInfo?.endCursor);

      if (willContinueInitial && pageInfo?.endCursor) {
        await new Promise((resolve) =>
          setTimeout(resolve, BATCH_FETCH_DELAY_MS)
        );
        fetchThreads(pageInfo.endCursor, false);
      } else if (initialLoadActiveRef.current) {
        initialLoadActiveRef.current = false;
        setListLoadingFlag('isFetching', false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      if (initialLoadActiveRef.current) {
        initialLoadActiveRef.current = false;
        setListLoadingFlag('isFetching', false);
      }
    } finally {
      setShouldLoadMore(false);
      setListLoadingFlag('isLoadingMore', false);
      if (isInitialLoad && !willContinueInitial) {
        setListLoadingFlag('isFetching', false);
      }
    }
  };

  // Initial fetch
  useEffect(() => {
    if (!isFetching && !threadHistory?.threads && !error) {
      fetchThreads();
    }
  }, [isFetching, threadHistory, error]);

  // Load more when user scrolls to bottom (if backend ever returns more pages after initial full load)
  useEffect(() => {
    if (threadHistory?.pageInfo) {
      const { hasNextPage, endCursor } = threadHistory.pageInfo;

      if (shouldLoadMore && !isLoadingMore && hasNextPage && endCursor) {
        fetchThreads(endCursor);
      }
    }
  }, [shouldLoadMore, isLoadingMore, threadHistory]);

  const showThreadList = Boolean(threadHistory || isFetching || isLoadingMore);
  const isLoading = isFetching || isLoadingMore;

  const displayedThreadHistory = useMemo(() => {
    if (!threadHistory?.threads) return threadHistory;
    const threads = threadsFilter
      ? threadHistory.threads.filter(threadsFilter)
      : threadHistory.threads;
    return {
      ...threadHistory,
      threads,
      timeGroupedThreads: groupByDate(threads)
    };
  }, [threadHistory, threadsFilter]);

  const currentThreadId = threadHistory?.currentThreadId ?? threadId ?? null;
  const sectionContainsSelected = Boolean(
    currentThreadId &&
    displayedThreadHistory?.threads?.some((t) => t.id === currentThreadId)
  );

  const sectionTitleNode =
    sectionTitle != null ? (
      typeof sectionTitle === 'string' ? (
        <Translator path={sectionTitle} />
      ) : (
        sectionTitle
      )
    ) : (
      <Translator path="threadHistory.sidebar.title" />
    );

  const listContent = showThreadList ? (
    <div
      id="thread-history"
      className="flex flex-col min-h-0"
      role="region"
      aria-label="Chat history list"
    >
      <ThreadList
        threadHistory={displayedThreadHistory}
        error={error}
        isFetching={isFetching}
        isLoadingMore={isLoadingMore}
        collapsedGroups={collapsedGroups}
        setCollapsedGroups={setCollapsedGroups}
        stickyTopOffset={SIDEBAR_RECENT_LIST_STICKY_TOP}
        compactFirstGroup
        folderTreeStyle
      />
    </div>
  ) : null;

  if (useChevronToggle) {
    return (
      <SidebarSection
        title={sectionTitleNode}
        expanded={sectionExpanded}
        onToggle={() => setSectionExpanded(!sectionExpanded)}
        containsSelected={sectionContainsSelected}
        isLoading={isLoading}
        ariaLabel="Recent chat section"
        stickyHeader
        sectionBackground="topics"
      >
        <div
          className={cn(
            'flex min-w-0 flex-col min-h-0 overflow-clip rounded-b-xl',
            SIDEBAR_SECTION_INNER_GAP,
            SIDEBAR_LIST_GAP_BG
          )}
        >
          <SidebarGroupContent className="min-h-0 min-w-0 overflow-clip rounded-xl px-0">
            <SidebarMenu className="gap-1">
              {listContent}
            </SidebarMenu>
          </SidebarGroupContent>
        </div>
      </SidebarSection>
    );
  }

  return (
    <SidebarContent
      className={cn('flex min-h-0 flex-1 flex-col p-0 overflow-hidden', SIDEBAR_SECTION_GAP)}
    >
      <header
        className={cn(
          'flex shrink-0 items-center select-none',
          SIDEBAR_SECTION_HEADER,
          SIDEBAR_SECTION_HEADER_HOVER
        )}
        aria-label="History section"
      >
        <p className={cn('min-w-0 flex-1 truncate text-left', SIDEBAR_SECTION_HEADER_TITLE)}>
          {sectionTitleNode}
        </p>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center">
          {isLoading ? (
            <Loader />
          ) : showCollapseButton && onCollapseAll ? (
            <ThreadCollapseButton visible onCollapseAll={onCollapseAll} />
          ) : (
            <span className="size-4 shrink-0" aria-hidden />
          )}
        </div>
      </header>
      {listContent}
    </SidebarContent>
  );
}

import { uniqBy } from 'lodash';
import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';

import {
  ChainlitContext,
  threadHistoryState,
  useChatMessages
} from '@chainlit/react-client';

import { threadListLoadingState } from '@/state/project';

import {
  SidebarContent,
  SidebarGroup,
  SidebarMenu
} from '@/components/ui/sidebar';

import { ThreadList } from './ThreadList';

const LIST_PAGINATION = {
  batchSize: 10,
  initialBatch: 1,
  /** Max threads loaded during initial progressive load (by count or until viewport filled). After this, more only via scroll. */
  initialPageCap: 5
} as const;

let scrollTopCache = 0;

interface ThreadHistoryProps {
  collapsedGroups?: Set<string> | null;
  setCollapsedGroups?: React.Dispatch<
    React.SetStateAction<Set<string> | null>
  >;
}

export function ThreadHistory({
  collapsedGroups,
  setCollapsedGroups
}: ThreadHistoryProps = {}) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const apiClient = useContext(ChainlitContext);
  const { firstInteraction, messages, threadId } = useChatMessages();
  const [threadHistory, setThreadHistory] = useRecoilState(threadHistoryState);
  const [listLoading, setListLoading] = useRecoilState(threadListLoadingState);
  const { isFetching, isLoadingMore } = listLoading;
  const [error, setError] = useState<string>();
  const [shouldLoadMore, setShouldLoadMore] = useState(false);
  const initialLoadActiveRef = useRef(false);
  const fillViewportCheckScheduledRef = useRef(false);

  const setListLoadingFlag = (key: 'isFetching' | 'isLoadingMore', value: boolean) =>
    setListLoading((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollTopCache;
  }, []);

  // Handle first interaction
  useEffect(() => {
    const handleFirstInteraction = async () => {
      if (!firstInteraction) return;

      const isActualResume =
        firstInteraction === 'resume' &&
        messages[0]?.output.toLowerCase() !== 'resume';

      if (isActualResume) return;

      await fetchThreads(undefined, true);

      const currentPage = new URL(window.location.href);
      if (threadId && currentPage.pathname === '/') {
        navigate(`/thread/${threadId}`);
      }
    };

    handleFirstInteraction();
  }, [firstInteraction]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;
    scrollTopCache = scrollTop;
    setShouldLoadMore(scrollTop + clientHeight >= scrollHeight - 10);
  };

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
        isInitialContinuation || isInitialLoad
          ? LIST_PAGINATION.initialBatch
          : LIST_PAGINATION.batchSize;
      const { pageInfo, data } = await apiClient.listThreads(
        { first, cursor },
        {}
      );

      setError(undefined);

      let mergedLength = 0;
      setThreadHistory((prev) => {
        const prevThreads = prev?.threads ?? [];
        const merged = uniqBy(
          cursor ? prevThreads.concat(data) : data,
          'id'
        );
        mergedLength = merged.length;
        return { ...prev, pageInfo, threads: merged };
      });

      willContinueInitial =
        initialLoadActiveRef.current &&
        Boolean(pageInfo?.hasNextPage && pageInfo?.endCursor) &&
        mergedLength < LIST_PAGINATION.initialPageCap;

      if (willContinueInitial && pageInfo?.endCursor) {
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

  // During initial load: keep loading until list fills viewport (so scrollbar appears) or cap / no more pages
  const pageInfo = threadHistory?.pageInfo;
  const endCursor = pageInfo?.endCursor;
  const threadsLength = threadHistory?.threads?.length ?? 0;
  useEffect(() => {
    if (
      fillViewportCheckScheduledRef.current ||
      isFetching ||
      isLoadingMore ||
      !initialLoadActiveRef.current ||
      threadsLength === 0 ||
      !pageInfo?.hasNextPage ||
      !endCursor ||
      threadsLength >= LIST_PAGINATION.initialPageCap
    ) {
      return;
    }
    fillViewportCheckScheduledRef.current = true;
    const cursorToFetch = endCursor;
    const raf = requestAnimationFrame(() => {
      fillViewportCheckScheduledRef.current = false;
      const el = scrollRef.current;
      if (!el) return;
      const overflow = el.scrollHeight > el.clientHeight;
      if (!overflow && cursorToFetch) {
        fetchThreads(cursorToFetch, false);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [threadsLength, pageInfo?.hasNextPage, endCursor, isFetching, isLoadingMore]);

  // Load more when user scrolls to bottom (infinite scroll; uses batchSize, not initialPageCap)
  useEffect(() => {
    if (threadHistory?.pageInfo) {
      const { hasNextPage, endCursor } = threadHistory.pageInfo;

      if (shouldLoadMore && !isLoadingMore && hasNextPage && endCursor) {
        fetchThreads(endCursor);
      }
    }
  }, [shouldLoadMore, isLoadingMore, threadHistory]);

  const showThreadList = Boolean(threadHistory || isFetching || isLoadingMore);

  return (
    <SidebarContent
      className="overflow-y-scroll"
      onScroll={handleScroll}
      ref={scrollRef}
    >
      <SidebarGroup>
        <SidebarMenu>
          {showThreadList ? (
            <div id="thread-history" className="flex-grow">
              <ThreadList
                threadHistory={threadHistory}
                error={error}
                isFetching={isFetching}
                isLoadingMore={isLoadingMore}
                collapsedGroups={collapsedGroups}
                setCollapsedGroups={setCollapsedGroups}
              />
            </div>
          ) : null}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
}

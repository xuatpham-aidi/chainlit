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
  initialBatch: 3,
  batchSize: 10
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
        isInitialLoad ? LIST_PAGINATION.initialBatch : LIST_PAGINATION.batchSize;
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
        Boolean(pageInfo?.hasNextPage && pageInfo?.endCursor);

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

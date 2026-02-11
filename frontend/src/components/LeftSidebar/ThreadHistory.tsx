import { uniqBy } from 'lodash';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';

import {
  ChainlitContext,
  IThread,
  threadHistoryState,
  useChatMessages
} from '@chainlit/react-client';

import { threadListLoadingState } from '@/state/project';

import {
  SidebarContent,
  SidebarGroup,
  SidebarMenu
} from '@/components/ui/sidebar';

import { CustomScrollbar } from '@/components/CustomScrollbar';

import { ThreadList } from './ThreadList';

const MAX_THREAD_NAME_LENGTH = 40;

const LIST_PAGINATION = {
  initialBatch: 3,
  batchSize: 10
} as const;

const BATCH_FETCH_DELAY_MS = 500;

let scrollTopCache = 0;

interface ThreadHistoryProps {
  collapsedGroups?: Set<string> | null;
  setCollapsedGroups?: React.Dispatch<
    React.SetStateAction<Set<string> | null>
  >;
  hideScrollbar?: boolean;
}

export function ThreadHistory({
  collapsedGroups,
  setCollapsedGroups,
  hideScrollbar = false
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

  return (
    <SidebarContent className="flex min-h-0 flex-1 flex-col gap-0 p-0 overflow-hidden">
      <CustomScrollbar
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1"
        variant="sidebar"
        hideScrollbar={hideScrollbar}
        invalidateKey={
          collapsedGroups
            ? Array.from(collapsedGroups).sort().join(',')
            : ''
        }
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
      </CustomScrollbar>
    </SidebarContent>
  );
}

import { useEffect, useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { threadHistoryState, useChatMessages, useConfig } from '@chainlit/react-client';

/**
 * Hook to update the browser tab title with the current thread name
 */
export function useDocumentTitle() {
  const { threadId } = useChatMessages();
  const threadHistory = useRecoilValue(threadHistoryState);
  const { config } = useConfig();

  // Find the current thread name from thread history
  const threadName = useMemo(() => {
    if (!threadId || !threadHistory?.threads) {
      return null;
    }

    const thread = threadHistory.threads.find((t) => t.id === threadId);
    return thread?.name || null;
  }, [threadId, threadHistory]);

  // Update document title when thread changes
  useEffect(() => {
    const baseTitle = config?.ui?.name || 'AI Assistant';
    
    if (threadName) {
      document.title = `${baseTitle} | ${threadName}`;
    } else {
      document.title = baseTitle;
    }

    // Cleanup: restore default title when component unmounts
    return () => {
      document.title = baseTitle;
    };
  }, [threadName, config?.ui?.name]);
}

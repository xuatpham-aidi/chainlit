import hljs from 'highlight.js';
import 'highlight.js/styles/monokai-sublime.css';
import { Bug, Database } from 'lucide-react';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ChainlitContext, type IFileElement } from '@chainlit/react-client';

import CopyButton from '@/components/CopyButton';
import { useLayoutMaxWidth } from '@/hooks/useLayoutMaxWidth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

type FileElementWithContent = IFileElement & { content?: string };

const HighlightedSQL = ({ code }: { code: string }) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      delete codeRef.current.dataset.highlighted;
      codeRef.current.textContent = code;
      hljs.highlightElement(codeRef.current);
    }
  }, [code]);

  return (
    <pre className="m-0">
      <code
        ref={codeRef}
        className="language-sql font-mono text-sm rounded-b-[var(--radius)] block"
      >
        {code}
      </code>
    </pre>
  );
};

const SQLFileElement = ({ element }: { element: IFileElement }) => {
  const [open, setOpen] = useState(false);
  const layoutMaxWidth = useLayoutMaxWidth();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dialogLeft, setDialogLeft] = useState<string>('50%');
  const el = element as FileElementWithContent;
  const hasContent = el.content != null && el.content !== '';
  const apiClient = useContext(ChainlitContext);
  const [fetchedSql, setFetchedSql] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const ensureData = useCallback(async () => {
    if (hasContent || fetchedSql) return;
    if (!element.threadId) return;
    setIsLoading(true);
    try {
      const response = await apiClient.get(
        `/project/element/${element.threadId}/${element.id}`
      );
      if (!response.ok) throw new Error('Failed to fetch SQL');
      const text = await response.text();
      setFetchedSql(text);
    } catch (err) {
      console.error('Failed to fetch SQL element:', err);
    } finally {
      setIsLoading(false);
    }
  }, [element.threadId, element.id, hasContent, fetchedSql, apiClient]);

  const sql = hasContent ? el.content! : fetchedSql;

  const handleOpen = () => {
    if (triggerRef.current) {
      const chatContainer = triggerRef.current.closest('.mx-auto') as HTMLElement | null;
      if (chatContainer) {
        const rect = chatContainer.getBoundingClientRect();
        setDialogLeft(`${rect.left + rect.width / 2}px`);
      }
    }
    setOpen(true);
    if (!hasContent) ensureData();
  };

  return (
    <>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              ref={triggerRef}
              type="button"
              onClick={handleOpen}
              className="inline-flex items-center gap-1.5 h-[32px] px-3 rounded-full border border-border/80 bg-secondary/50 hover:bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors duration-150"
            >
              <Bug className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>SQL Query</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-none p-0 gap-0 overflow-hidden border-border/80 bg-card shadow-xl [&>button]:hidden" style={{ width: layoutMaxWidth, left: dialogLeft }}>
          <DialogHeader className="flex flex-row items-center justify-between px-5 pt-4 pb-3">
            <DialogTitle className="flex items-center gap-2.5 text-sm font-semibold text-card-foreground">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/10">
                <Database className="h-4 w-4 text-primary" />
              </div>
              SQL Query
            </DialogTitle>
            <CopyButton content={sql} />
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="px-5 pb-5">
                <Skeleton className="h-32 w-full rounded-[var(--radius)]" />
              </div>
            ) : (
              <HighlightedSQL code={sql} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { SQLFileElement };

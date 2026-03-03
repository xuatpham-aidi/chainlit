import hljs from 'highlight.js';
import 'highlight.js/styles/monokai-sublime.css';
import { Bug, Database } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { type IFileElement } from '@chainlit/react-client';

import CopyButton from '@/components/CopyButton';
import { Attachment } from '@/components/chat/MessageComposer/Attachment';
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

import { useFetch } from 'hooks/useFetch';

const isSQLFile = (name: string) => name.toLowerCase().endsWith('sql');

const HighlightedSQL = ({ code }: { code: string }) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
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
  const { data, isLoading } = useFetch(open ? element.url || null : null);
  const sql = typeof data === 'string' ? data : '';

  return (
    <>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setOpen(true)}
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
        <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden border-border/80 bg-card shadow-xl [&>button]:hidden">
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

const FileElement = ({ element }: { element: IFileElement }) => {
  if (!element.url) {
    return null;
  }

  if (isSQLFile(element.name)) {
    return <SQLFileElement element={element} />;
  }

  return (
    <a
      className={`${element.display}-file no-underline`}
      download={element.name}
      href={element.url}
    >
      <Attachment name={element.name} mime={element.mime!} />
    </a>
  );
};

export { FileElement };

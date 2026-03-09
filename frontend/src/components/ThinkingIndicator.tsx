import { cn } from '@/lib/utils';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronRight } from 'lucide-react';
import { Translator } from 'components/i18n';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  className?: string;
  completedSeconds?: number;
  thinkingContent?: string;
  timestamp?: string;
  trailing?: ReactNode;
}

function ThinkingIndicator({ className, completedSeconds, thinkingContent, timestamp, trailing }: Props) {
  const isCompleted = completedSeconds != null;

  // Cache content so it persists even if the prop becomes empty after streaming
  const cachedContentRef = useRef(thinkingContent);
  if (thinkingContent) {
    cachedContentRef.current = thinkingContent;
  }
  const displayContent = cachedContentRef.current || '';
  const hasContent = Boolean(displayContent);

  // Reload: isCompleted && hasContent on mount -> collapsed
  // Active streaming with buffered content: !isCompleted && hasContent -> expanded
  const [value, setValue] = useState(() =>
    hasContent && !isCompleted ? 'thinking' : ''
  );

  // Track whether user manually collapsed
  const userCollapsedRef = useRef(false);
  const handleValueChange = useCallback((newValue: string) => {
    if (newValue === '') {
      userCollapsedRef.current = true;
    }
    setValue(newValue);
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevHasContentRef = useRef(hasContent);

  useEffect(() => {
    // Auto-expand when content appears (false -> true transition),
    // unless user manually collapsed.
    if (hasContent && !prevHasContentRef.current && !userCollapsedRef.current) {
      setValue('thinking');
    }
    prevHasContentRef.current = hasContent;
  }, [hasContent]);

  // Auto-collapse when processing completes (message starts streaming)
  const prevCompletedRef = useRef(isCompleted);
  useEffect(() => {
    if (isCompleted && !prevCompletedRef.current) {
      setValue('');
    }
    prevCompletedRef.current = isCompleted;
  }, [isCompleted]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [thinkingContent]);

  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      value={value}
      onValueChange={hasContent ? handleValueChange : undefined}
      className={cn('w-full select-none', className)}
      data-testid="thinking-indicator"
    >
      <AccordionPrimitive.Item value="thinking" className="border-none">
        <AccordionPrimitive.Header className="flex items-center min-h-8">
          <AccordionPrimitive.Trigger
            className={cn(
              'flex items-center gap-2 py-1 group',
              hasContent ? 'cursor-pointer' : 'cursor-default'
            )}
            aria-label={isCompleted ? 'Processing complete' : 'Assistant is typing'}
          >
            <span className="h-3.5 w-3.5 shrink-0 inline-flex items-center justify-center">
              {hasContent ? (
                <ChevronRight
                  className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90"
                />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
              )}
            </span>
            <span className="grid items-center [&>*]:col-start-1 [&>*]:row-start-1">
              <span
                className={cn(
                  'flex items-center gap-2 transition-all duration-300 ease-in-out',
                  isCompleted
                    ? 'opacity-0 scale-95 pointer-events-none'
                    : 'opacity-100 scale-100'
                )}
              >
                <span className="text-sm font-bold text-muted-foreground shrink-0 animate-pulse">
                  <Translator path="chat.messages.processing" />
                </span>
              </span>
              <span
                className={cn(
                  'flex items-center transition-all duration-300 ease-in-out',
                  isCompleted
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-95 pointer-events-none'
                )}
              >
                <span className="text-xs text-muted-foreground shrink-0">
                  <Translator
                    path="chat.messages.completed"
                    options={{ seconds: completedSeconds?.toFixed(2).replace(/\.?0+$/, "") ?? "0" }}
                  />
                </span>
              </span>
            </span>
          </AccordionPrimitive.Trigger>
          {trailing ? (
            <div className="flex items-center gap-2 ml-8 shrink-0">
              {trailing}
            </div>
          ) : null}
          {timestamp ? (
            <span className="text-xs text-muted-foreground ml-auto shrink-0">
              {timestamp}
            </span>
          ) : null}
        </AccordionPrimitive.Header>
        {hasContent ? (
          <AccordionPrimitive.Content
            className="overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
          >
            <div ref={scrollRef} className="max-h-40 overflow-y-auto custom-scrollbar ml-5 my-1 border-l-4 border-l-primary/40 bg-muted/50 rounded-r-md px-3 py-2">
              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {displayContent}
              </p>
            </div>
          </AccordionPrimitive.Content>
        ) : null}
      </AccordionPrimitive.Item>
    </AccordionPrimitive.Root>
  );
}

export { ThinkingIndicator };

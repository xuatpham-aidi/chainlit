import { cn } from '@/lib/utils';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronRight } from 'lucide-react';
import { Translator } from 'components/i18n';
import { useEffect, useState } from 'react';

interface Props {
  className?: string;
  completedSeconds?: number;
  thinkingContent?: string;
  timestamp?: string;
}

function ThinkingIndicator({ className, completedSeconds, thinkingContent, timestamp }: Props) {
  const isCompleted = completedSeconds != null;
  const hasContent = Boolean(thinkingContent);
  const [value, setValue] = useState('');

  useEffect(() => {
    if (isCompleted) {
      setValue('');
    } else if (hasContent) {
      setValue('thinking');
    }
  }, [isCompleted, hasContent]);

  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      value={value}
      onValueChange={hasContent ? setValue : undefined}
      className={cn('w-full select-none', className)}
      data-testid="thinking-indicator"
    >
      <AccordionPrimitive.Item value="thinking" className="border-none">
        <AccordionPrimitive.Header className="flex items-center min-h-7">
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
              ) : null}
            </span>
            <span className="relative h-5 inline-flex items-center">
              <span
                className={cn(
                  'flex items-center gap-2 transition-all duration-300 ease-in-out absolute left-0',
                  isCompleted
                    ? 'opacity-0 scale-95 pointer-events-none'
                    : 'opacity-100 scale-100'
                )}
              >
                <span className="text-sm font-bold text-muted-foreground shrink-0">
                  <Translator path="chat.messages.processing" />
                </span>
                <span className="h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
              </span>
              <span
                className={cn(
                  'flex items-center transition-all duration-300 ease-in-out absolute left-0',
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
            <div className="max-h-32 overflow-y-auto custom-scrollbar text-xs text-muted-foreground whitespace-pre-wrap px-1 py-2">
              {thinkingContent}
            </div>
          </AccordionPrimitive.Content>
        ) : null}
      </AccordionPrimitive.Item>
    </AccordionPrimitive.Root>
  );
}

export { ThinkingIndicator };

import { cn } from '@/lib/utils';
import { Translator } from 'components/i18n';

interface Props {
  className?: string;
}

/**
 * "Processing" label and bouncing dots shown while the assistant is thinking/replying.
 */
function ThinkingIndicator({ className }: Props) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 py-1',
        'self-start',
        className
      )}
      data-testid="thinking-indicator"
      aria-label="Assistant is typing"
    >
      <span className="h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-muted-foreground shrink-0">
        <Translator path="chat.messages.processing" />
      </span>
    </div>
  );
}

export { ThinkingIndicator };

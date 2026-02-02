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
      <span className="text-sm text-muted-foreground shrink-0">
        <Translator path="chat.messages.processing" />
      </span>
      <span
        className="h-2 w-2 rounded-full bg-muted-foreground animate-thinking-dot"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="h-2 w-2 rounded-full bg-muted-foreground animate-thinking-dot"
        style={{ animationDelay: '160ms' }}
      />
      <span
        className="h-2 w-2 rounded-full bg-muted-foreground animate-thinking-dot"
        style={{ animationDelay: '320ms' }}
      />
    </div>
  );
}

export { ThinkingIndicator };

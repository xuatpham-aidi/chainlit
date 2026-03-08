import { cn } from '@/lib/utils';
import { Translator } from 'components/i18n';

interface Props {
  className?: string;
  completedSeconds?: number;
}

/**
 * Shows a spinning indicator with "Processing" while thinking,
 * then smoothly transitions to "Completed in X.XX seconds" once done.
 */
function ThinkingIndicator({ className, completedSeconds }: Props) {
  const isCompleted = completedSeconds != null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 py-1',
        'self-start relative select-none',
        className
      )}
      data-testid="thinking-indicator"
      aria-label={isCompleted ? 'Processing complete' : 'Assistant is typing'}
    >
      <div
        className={cn(
          'flex items-center gap-2 transition-all duration-300 ease-in-out',
          isCompleted
            ? 'opacity-0 scale-95 absolute pointer-events-none'
            : 'opacity-100 scale-100'
        )}
      >
        <span className="h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold text-muted-foreground shrink-0">
          <Translator path="chat.messages.processing" />
        </span>
      </div>
      <div
        className={cn(
          'flex items-center transition-all duration-300 ease-in-out',
          isCompleted
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95 absolute pointer-events-none'
        )}
      >
        <span className="text-xs text-muted-foreground shrink-0">
          <Translator
            path="chat.messages.completed"
            options={{ seconds: completedSeconds?.toFixed(1).replace(/\.0$/, "") ?? '0' }}
          />
        </span>
      </div>
    </div>
  );
}

export { ThinkingIndicator };

import { cn } from '@/lib/utils';

export const CURSOR_PLACEHOLDER = '\u200B';

interface Props {
  whitespace?: boolean;
}

export default function BlinkingCursor({ whitespace }: Props) {
  return (
    <span
      className={cn(
        'inline-block h-2.5 w-2.5 rounded-full',
        whitespace && 'ml-2'
      )}
      style={{
        background: 'linear-gradient(135deg, #0d6efd, #0ea5a0, #22c55e)',
        animation: 'nbc-pulse 1.4s ease-in-out infinite',
        boxShadow: '0 0 6px rgba(14, 165, 160, 0.4)',
      }}
    >
      <style>{`
        @keyframes nbc-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </span>
  );
}

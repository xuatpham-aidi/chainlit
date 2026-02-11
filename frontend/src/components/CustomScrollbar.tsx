import { cn } from '@/lib/utils';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';

const MIN_THUMB_HEIGHT = 24;

const SCROLLBAR_VARIANT_CLASSES = {
  sidebar: {
    track: 'w-1 pr-0.5',
    trackInset: 'top-1 bottom-1',
    thumb: 'w-1',
    thumbColor:
      'bg-sidebar-foreground/25 hover:bg-sidebar-foreground/45 active:bg-sidebar-foreground/55'
  },
  chat: {
    track: 'w-2.5 pr-1',
    trackInset: 'top-4 bottom-4',
    thumb: 'w-1.5',
    thumbColor:
      'bg-muted-foreground/80 hover:bg-muted-foreground/50 active:bg-muted-foreground/60'
  }
} as const;

export type ScrollbarVariant = keyof typeof SCROLLBAR_VARIANT_CLASSES;

interface CustomScrollbarProps {
  children: React.ReactNode;
  className?: string;
  onScroll?: () => void;
  hideScrollbar?: boolean;
  /** When this changes, thumb visibility is rechecked (e.g. after expand/collapse). */
  invalidateKey?: string | number;
  /** Width variant: sidebar (narrow) or chat (wider). Defaults to 'chat'. */
  variant?: ScrollbarVariant;
}

const CustomScrollbar = forwardRef<HTMLDivElement | null, CustomScrollbarProps>(
  function CustomScrollbar(
    {
      children,
      className,
      onScroll,
      hideScrollbar = false,
      invalidateKey,
      variant = 'chat'
    },
    ref
  ) {
    const variantClasses = SCROLLBAR_VARIANT_CLASSES[variant];
    const scrollRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const [thumbStyle, setThumbStyle] = useState({
      height: 0,
      top: 0,
      visible: false
    });
    const dragRef = useRef({
      active: false,
      startY: 0,
      startScrollTop: 0,
      trackHeight: 0,
      thumbHeight: 0
    });

    useImperativeHandle(
      ref,
      () => scrollRef.current as HTMLDivElement,
      []
    );

    const updateThumb = useCallback(() => {
      const el = scrollRef.current;
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const maxScroll = scrollHeight - clientHeight;
      const visible = maxScroll > 0 && clientHeight > 0;
      if (!visible) {
        setThumbStyle({ height: 0, top: 0, visible: false });
        return;
      }
      const trackEl = trackRef.current;
      const trackHeight = trackEl?.clientHeight ?? clientHeight;
      const thumbHeight = Math.max(
        MIN_THUMB_HEIGHT,
        (clientHeight / scrollHeight) * trackHeight
      );
      const thumbTop =
        maxScroll > 0
          ? (scrollTop / maxScroll) * (trackHeight - thumbHeight)
          : 0;
      setThumbStyle({ height: thumbHeight, top: thumbTop, visible: true });
    }, []);

    const handleScroll = useCallback(() => {
      updateThumb();
      onScroll?.();
    }, [onScroll, updateThumb]);

    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      const runUpdate = () => requestAnimationFrame(updateThumb);
      updateThumb();
      const ro = new ResizeObserver(runUpdate);
      ro.observe(el);
      const firstChild = el.firstElementChild;
      if (firstChild) ro.observe(firstChild);
      const track = trackRef.current;
      if (track) ro.observe(track);
      const mo = new MutationObserver(runUpdate);
      mo.observe(el, { childList: true, subtree: true });
      const t = setTimeout(runUpdate, 0);
      return () => {
        clearTimeout(t);
        ro.disconnect();
        mo.disconnect();
      };
    }, [updateThumb, thumbStyle.visible]);

    useEffect(() => {
      if (invalidateKey === undefined) return;
      const t = requestAnimationFrame(updateThumb);
      return () => cancelAnimationFrame(t);
    }, [invalidateKey, updateThumb]);

    const handleThumbMouseDown = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        if (!scrollRef.current) return;
        const el = scrollRef.current;
        const trackHeight = trackRef.current?.clientHeight ?? el.clientHeight;
        const maxScroll = el.scrollHeight - el.clientHeight;
        const thumbHeight = Math.max(
          MIN_THUMB_HEIGHT,
          (el.clientHeight / el.scrollHeight) * trackHeight
        );
        dragRef.current = {
          active: true,
          startY: e.clientY,
          startScrollTop: el.scrollTop,
          trackHeight,
          thumbHeight
        };

        const onMove = (moveEvent: MouseEvent) => {
          if (!scrollRef.current) return;
          const { startY, startScrollTop, trackHeight: th, thumbHeight: thH } =
            dragRef.current;
          const deltaY = moveEvent.clientY - startY;
          const scrollEl = scrollRef.current;
          const max = scrollEl.scrollHeight - scrollEl.clientHeight;
          const thumbTravel = Math.max(0, th - thH);
          const scrollDelta =
            thumbTravel > 0 ? (deltaY / thumbTravel) * max : 0;
          scrollEl.scrollTop = Math.max(
            0,
            Math.min(max, startScrollTop + scrollDelta)
          );
        };

        const onUp = () => {
          dragRef.current.active = false;
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      },
      []
    );

    return (
      <div className={cn('relative flex min-h-0 flex-1 flex-col', className)}>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="custom-scrollbar-native-hidden h-full min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
        >
          {children}
        </div>
        {thumbStyle.visible && !hideScrollbar && (
          <div
            ref={trackRef}
            className={cn(
              'absolute right-0 shrink-0',
              variantClasses.track,
              variantClasses.trackInset
            )}
            style={{ touchAction: 'none' }}
          >
            <div
              className={cn(
                'absolute right-0 top-0 rounded-full cursor-grab active:cursor-grabbing',
                variantClasses.thumb,
                variantClasses.thumbColor
              )}
              style={{
                height: thumbStyle.height,
                top: thumbStyle.top
              }}
              onMouseDown={handleThumbMouseDown}
              aria-hidden
            />
          </div>
        )}
      </div>
    );
  }
);

CustomScrollbar.displayName = 'CustomScrollbar';

export { CustomScrollbar };

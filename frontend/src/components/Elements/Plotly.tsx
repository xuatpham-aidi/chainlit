import { Suspense, lazy, useMemo } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

import { useFetch } from 'hooks/useFetch';

import { type IPlotlyElement } from 'client-types/';

const Plot = lazy(() => import('react-plotly.js'));

type PlotlyElementWithContent = IPlotlyElement & { content?: string };

interface Props {
  element: IPlotlyElement;
}

type PlotlyState = {
  data: unknown[];
  layout: object;
  frames?: unknown[];
  config?: object;
};

function parseJsonSafe(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parsePlotlyState(raw: unknown): PlotlyState | null {
  if (raw == null) return null;
  const parsed = typeof raw === 'string' ? parseJsonSafe(raw) : raw;
  if (parsed == null || typeof parsed !== 'object' || !('data' in parsed) || !Array.isArray(parsed.data)) {
    return null;
  }
  const p = parsed as { data: unknown[]; layout?: object; frames?: unknown[]; config?: object };
  return {
    data: p.data,
    layout: p.layout ?? {},
    frames: Array.isArray(p.frames) ? p.frames : undefined,
    config: p.config,
  };
}

const PLOT_STYLE = {
  width: '100%',
  height: '100%',
  borderRadius: '1rem',
  overflow: 'hidden'
} as const;

const _PlotlyElement = ({ element }: Props) => {
  const el = element as PlotlyElementWithContent;
  const hasContent = el.content != null && el.content !== '';
  const contentState = useMemo(
    () => (hasContent ? parsePlotlyState(el.content) : null),
    [hasContent, el.content]
  );
  const { data, error, isLoading } = useFetch(hasContent ? null : (element.url || null));

  function renderPlot(state: PlotlyState) {
    return (
      <Suspense fallback={<Skeleton className="h-full rounded-md" />}>
        <Plot
          className={`${element.display}-plotly`}
          data={state.data as object[]}
          layout={state.layout}
          frames={state.frames as never}
          config={state.config}
          style={PLOT_STYLE}
          useResizeHandler={true}
        />
      </Suspense>
    );
  }

  if (hasContent && contentState) {
    return renderPlot(contentState);
  }
  if (!hasContent && isLoading) {
    return <div>Loading...</div>;
  }
  if (!hasContent && error) {
    return <div>An error occurred</div>;
  }
  if (!hasContent && data != null) {
    const state = parsePlotlyState(data);
    if (state) return renderPlot(state);
  }
  return null;
};

const PlotlyElement = (props: Props) => {
  return (
    <ErrorBoundary prefix="Failed to load chart.">
      <_PlotlyElement {...props} />
    </ErrorBoundary>
  );
};

export { PlotlyElement };

import { prepareContent } from '@/lib/message';
import { cn } from '@/lib/utils';
import { isEqual } from 'lodash';
import { forwardRef, memo, useMemo } from 'react';

import type { IMessageElement, IStep } from '@chainlit/react-client';

import { CURSOR_PLACEHOLDER } from '@/components/BlinkingCursor';
import { Markdown } from '@/components/Markdown';

import { InlinedElements } from './InlinedElements';

type ContentSection = 'input' | 'output';

export interface Props {
  elements: IMessageElement[];
  message: IStep;
  allowHtml?: boolean;
  latex?: boolean;
  sections?: ContentSection[];
  isUserMessage?: boolean;
}

const getMessageRenderProps = (message: IStep) => ({
  id: message.id,
  output: message.output,
  input: message.input,
  language: message.language,
  streaming: message.streaming,
  showInput: message.showInput,
  type: message.type
});

// Format utcTimestamp to local time
const formatTime = (utcTimestamp: number | string | undefined): string => {
  if (!utcTimestamp) return '';

  // UTC : client timezone (automatic)
  const date = new Date(utcTimestamp);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const MessageContent = memo(
  forwardRef<HTMLDivElement, Props>(
    (
      { isUserMessage = false, message, elements, allowHtml, latex, sections },
      ref
    ) => {
      const outputContent =
        message.streaming && message.output
          ? message.output + CURSOR_PLACEHOLDER
          : message.output;

      const {
        preparedContent: output,
        inlinedElements: outputInlinedElements,
        refElements: outputRefElements
      } = prepareContent({
        elements,
        id: message.id,
        content: outputContent,
        language: message.language
      });

      const selectedSections = sections ?? ['input', 'output'];
      const sectionsSet = useMemo(
        () => new Set(selectedSections),
        [selectedSections]
      );

      const displayInput =
        sectionsSet.has('input') && message.input && message.showInput;
      const displayOutput = sectionsSet.has('output');

      const isMessage = message.type.includes('message');

      const outputMarkdown = displayOutput ? (
        <>
          {!isMessage && displayInput && message.output ? (
            <div className="font-medium">Output</div>
          ) : null}
          <Markdown
            allowHtml={allowHtml}
            latex={latex}
            refElements={outputRefElements}
          >
            {output}
          </Markdown>
        </>
      ) : null;

      let inputMarkdown;

      if (displayInput) {
        const inputContent =
          message.streaming && message.input
            ? message.input + CURSOR_PLACEHOLDER
            : message.input;
        const { preparedContent: input, refElements: inputRefElements } =
          prepareContent({
            elements,
            id: message.id,
            content: inputContent,
            language:
              typeof message.showInput === 'string'
                ? message.showInput
                : undefined
          });

        inputMarkdown = (
          <>
            <Markdown
              allowHtml={allowHtml}
              latex={latex}
              refElements={inputRefElements}
            >
              {input}
            </Markdown>
          </>
        );
      }

      const markdownContent = (
        <div className="flex flex-col gap-4">
          {inputMarkdown}
          {outputMarkdown}
        </div>
      );

      const timestamp = formatTime(message.createdAt);
      return (
        <div
          ref={ref}
          className="self-end message-content w-full flex flex-col gap-2"
        >
          {displayInput || (displayOutput && output) ? markdownContent : null}
          {displayOutput ? (
            <InlinedElements elements={outputInlinedElements} />
          ) : null}
          {timestamp && (displayInput || (displayOutput && output)) ? (
            <div
              className={cn(
                'text-xs text-muted-foreground mt-1',
                isUserMessage ? 'self-end' : 'self-start'
              )}
            >
              {timestamp}
            </div>
          ) : null}
        </div>
      );
    }
  ),
  (prevProps, nextProps) => {
    return (
      prevProps.allowHtml === nextProps.allowHtml &&
      prevProps.latex === nextProps.latex &&
      prevProps.elements === nextProps.elements &&
      isEqual(
        prevProps.sections ?? ['input', 'output'],
        nextProps.sections ?? ['input', 'output']
      ) &&
      isEqual(
        getMessageRenderProps(prevProps.message),
        getMessageRenderProps(nextProps.message)
      )
    );
  }
);

export { MessageContent };

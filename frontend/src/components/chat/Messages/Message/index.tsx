import { cn } from '@/lib/utils';
import { MessageContext } from 'contexts/MessageContext';
import { memo, useContext, useMemo, useRef } from 'react';

import {
  type IAction,
  type IFileElement,
  type IMessageElement,
  type IStep
} from '@chainlit/react-client';

import { useLayoutMaxWidth } from 'hooks/useLayoutMaxWidth';

import { isSQLFile, isXLSXFile } from '@/components/Elements/File';
import { ThinkingIndicator } from '@/components/ThinkingIndicator';
import { InlinedFileList } from './Content/InlinedElements/InlinedFileList';
import { Messages } from '..';
import { AskActionButtons } from './AskActionButtons';
import { AskFileButton } from './AskFileButton';
import { MessageAvatar } from './Avatar';
import { MessageButtons } from './Buttons';
import { MessageContent, formatTime } from './Content';
import Step from './Step';
import UserMessage from './UserMessage';

interface Props {
  message: IStep;
  elements: IMessageElement[];
  actions: IAction[];
  indent: number;
  isRunning?: boolean;
  isScorable?: boolean;
  scorableRun?: IStep;
  isLatestMessage?: boolean;
  lastAssistantMessageId?: string;
  runStartedAt?: number | string;
  thinkingContent?: string;
}

const EMPTY_ELEMENTS: IMessageElement[] = [];

const Message = memo(
  ({
    message,
    elements,
    actions,
    isRunning,
    indent,
    isScorable,
    scorableRun,
    isLatestMessage = true,
    lastAssistantMessageId,
    runStartedAt,
    thinkingContent
  }: Props) => {
    const { allowHtml, cot, latex, onError } = useContext(MessageContext);
    const layoutMaxWidth = useLayoutMaxWidth();
    const contentRef = useRef<HTMLDivElement>(null);
    const isUserMessage = message.type === 'user_message';
    const isStep = !message.type.includes('message');
    // Only keep tool calls if Chain of Thought is tool_call
    const toolCallSkip =
      isStep && cot === 'tool_call' && message.type !== 'tool';

    const hiddenSkip = isStep && cot === 'hidden';

    const skip = toolCallSkip || hiddenSkip;
    const showInputSection = Boolean(message.input && message.showInput);
    const shouldRenderOutput = !showInputSection || Boolean(message.output);

    const isToolFile = (el: IMessageElement): el is IFileElement =>
      el.type === 'file' && (isSQLFile(el.name) || isXLSXFile(el.name));

    const toolFileElements = useMemo(
      () => elements
        .filter((el) => el.forId === message.id && isToolFile(el))
        .sort((a, b) => a.name.localeCompare(b.name)) as IFileElement[],
      [elements, message.id]
    );

    const contentElements = useMemo(
      () => toolFileElements.length > 0
        ? elements.filter((el) => !toolFileElements.includes(el as IFileElement))
        : elements,
      [elements, toolFileElements]
    );

    const userMessageContent = useMemo(
      () => (
        <MessageContent
          isUserMessage={true}
          elements={EMPTY_ELEMENTS}
          message={message}
          allowHtml={allowHtml}
          latex={latex}
        />
      ),
      [message, allowHtml, latex]
    );

    if (skip) {
      if (!message.steps) {
        return null;
      }
      return (
        <Messages
          messages={message.steps}
          elements={elements}
          actions={actions}
          indent={indent}
          isRunning={isRunning}
          scorableRun={scorableRun}
          lastAssistantMessageId={lastAssistantMessageId}
        />
      );
    }

    return (
      <>
        <div data-step-type={message.type} className="step py-2">
          <div
            className="flex flex-col"
            style={{
              maxWidth: indent ? '100%' : layoutMaxWidth
            }}
          >
            <div
              className={cn('flex flex-grow pb-2')}
              id={`step-${message.id}`}
            >
              {/* User message is displayed differently */}
              {isUserMessage ? (
                <div className="flex flex-col flex-grow max-w-full">
                  <UserMessage message={message} elements={elements}>
                    {userMessageContent}
                  </UserMessage>
                </div>
              ) : (
                <div className="flex flex-col w-full">
                  <div className="ai-message flex gap-4 w-full">
                    {!isStep || !indent ? (
                      <MessageAvatar
                        author={message.metadata?.avatarName || message.name}
                        isError={message.isError}
                      />
                    ) : null}
                    {/* Display the step and its children */}
                    {isStep ? (
                      <Step step={message} isRunning={isRunning}>
                        {showInputSection ? (
                          <MessageContent
                            elements={elements}
                            message={message}
                            allowHtml={allowHtml}
                            latex={latex}
                            sections={['input']}
                          />
                        ) : null}
                        {message.steps ? (
                          <Messages
                            messages={message.steps.filter(
                              (s) => !s.type.includes('message')
                            )}
                            elements={elements}
                            actions={actions}
                            indent={indent + 1}
                            isRunning={isRunning}
                            lastAssistantMessageId={lastAssistantMessageId}
                          />
                        ) : null}
                        {shouldRenderOutput ? (
                          <MessageContent
                            ref={contentRef}
                            elements={elements}
                            message={message}
                            allowHtml={allowHtml}
                            latex={latex}
                            sections={showInputSection ? ['output'] : undefined}
                            isLatestMessage={isLatestMessage}
                          />
                        ) : null}
                        <MessageButtons
                          message={message}
                          actions={actions}
                          contentRef={contentRef}
                        />
                      </Step>
                    ) : (
                      // Display an assistant message
                      <div
                        className={cn(
                          'flex flex-col items-start min-w-[150px] flex-grow gap-2',
                          'px-5 py-2.5 rounded-2xl shadow-[var(--ai-message-shadow)]',
                          'bg-[hsl(var(--ai-message-bg))] w-full group'
                        )}
                      >
                        {/* Sticky boundary: buttons stick while content is in view */}
                        <div className="relative w-full">
                          <div className="sticky top-0 z-10 flex justify-end w-full min-h-5 [&_button]:h-5 [&_button]:w-5 [&_svg]:h-3.5 [&_svg]:w-3.5 bg-[hsl(var(--ai-message-bg))] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <MessageButtons
                              message={message}
                              actions={actions}
                              run={
                                scorableRun && isScorable ? scorableRun : undefined
                              }
                              contentRef={contentRef}
                            />
                          </div>
                          <MessageContent
                            ref={contentRef}
                            elements={contentElements}
                            message={message}
                            allowHtml={allowHtml}
                            latex={latex}
                            hideTimestamp
                            isLatestMessage={isLatestMessage}
                          />
                        </div>
                        {/* Thinking indicator and timestamp outside sticky boundary */}
                        {(() => {
                          const formattedTime = formatTime(message.createdAt);
                          const showIndicator = !isStep && !indent && runStartedAt;
                          if (!formattedTime && !showIndicator) return null;
                          const visibleTimestamp = formattedTime && message.output ? formattedTime : undefined;
                          return (
                            <div className="w-full select-none min-h-8">
                              {showIndicator ? (
                                <ThinkingIndicator
                                  className="py-0"
                                  thinkingContent={thinkingContent}
                                  completedSeconds={
                                    message.start && (!isRunning || message.output)
                                      ? (new Date(message.start).getTime() - new Date(runStartedAt).getTime()) / 1000
                                      : undefined
                                  }
                                  timestamp={visibleTimestamp}
                                  trailing={toolFileElements.length > 0 ? <InlinedFileList items={toolFileElements} /> : undefined}
                                />
                              ) : (
                                <div className="flex w-full justify-end items-center gap-2 min-h-8">
                                  {toolFileElements.length > 0 ? <InlinedFileList items={toolFileElements} /> : null}
                                  {visibleTimestamp ? (
                                    <span className="text-xs text-muted-foreground">
                                      {visibleTimestamp}
                                    </span>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Make sure the child assistant messages of a step are displayed at the root level. */}
        {message.steps && isStep ? (
          <Messages
            messages={message.steps.filter((s) => s.type.includes('message'))}
            elements={elements}
            actions={actions}
            indent={0}
            isRunning={isRunning}
            scorableRun={scorableRun}
            lastAssistantMessageId={lastAssistantMessageId}
          />
        ) : null}
        {/* Display the child steps if the message is not a step (usually a user message). */}
        {message.steps && !isStep ? (
          <Messages
            messages={message.steps}
            elements={elements}
            actions={actions}
            indent={indent}
            isRunning={isRunning}
            lastAssistantMessageId={lastAssistantMessageId}
          />
        ) : null}
      </>
    );
  }
);

export { Message };

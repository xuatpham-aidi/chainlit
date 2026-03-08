import { cn } from '@/lib/utils';
import { MessageContext } from 'contexts/MessageContext';
import { memo, useContext, useMemo, useRef } from 'react';

import {
  type IAction,
  type IMessageElement,
  type IStep
} from '@chainlit/react-client';

import { useLayoutMaxWidth } from 'hooks/useLayoutMaxWidth';

import { ThinkingIndicator } from '@/components/ThinkingIndicator';
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
    runStartedAt
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
                          <div className="sticky top-0 z-10 flex justify-end w-full [&_button]:h-5 [&_button]:w-5 [&_svg]:h-3.5 [&_svg]:w-3.5 bg-[hsl(var(--ai-message-bg))] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                            elements={elements}
                            message={message}
                            allowHtml={allowHtml}
                            latex={latex}
                            hideTimestamp
                            isLatestMessage={isLatestMessage}
                          />
                        </div>
                        {/* Timestamp outside sticky boundary */}
                        {formatTime(message.createdAt) && (
                          <div className="flex w-full justify-end select-none min-h-7 items-center">
                            <span className="text-xs text-muted-foreground">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Thinking indicator: shows completed time once streaming starts */}
                  {!isStep && !indent && runStartedAt && message.start ? (
                    <div className="flex gap-4 w-full items-center mt-1">
                      <div className="w-5 shrink-0" aria-hidden />
                      <div className="flex-grow min-w-0 flex items-center justify-start pl-5">
                        <ThinkingIndicator
                          className="py-0"
                          completedSeconds={
                            (new Date(message.start).getTime() - new Date(runStartedAt).getTime()) / 1000
                          }
                        />
                      </div>
                    </div>
                  ) : null}
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

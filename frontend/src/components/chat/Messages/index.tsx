import { MessageContext } from 'contexts/MessageContext';
import React, { memo, useContext, useMemo } from 'react';

import {
  type IAction,
  type IMessageElement,
  type IStep
} from '@chainlit/react-client';

import { ThinkingIndicator } from '@/components/ThinkingIndicator';

import { Message } from './Message';

const CL_RUN_NAMES = ['on_chat_start', 'on_message', 'on_audio_end'];

const hasActiveToolStep = (step: IStep): boolean => {
  return (
    step.steps?.some(
      (s) =>
        (s.type === 'tool' && s.start && !s.end && !s.isError) ||
        s.type.includes('message') ||
        hasActiveToolStep(s)
    ) || false
  );
};

const hasAssistantMessage = (step: IStep): boolean => {
  return (
    step.steps?.some(
      (s) => s.type === 'assistant_message' || hasAssistantMessage(s)
    ) || false
  );
};

/** Depth-first walk; returns the id of the last assistant_message in the tree. */
function findLastAssistantMessageIdInTree(steps: IStep[]): string | undefined {
  let lastId: string | undefined;
  function walk(list: IStep[]) {
    for (const s of list) {
      if (s.type === 'assistant_message') lastId = s.id;
      if (s.steps?.length) walk(s.steps);
    }
  }
  walk(steps);
  return lastId;
}

interface Props {
  messages: IStep[];
  elements: IMessageElement[];
  actions: IAction[];
  indent: number;
  isRunning?: boolean;
  scorableRun?: IStep;
  /** When set, only this message id gets isLatestMessage=true (thread-level last). */
  lastAssistantMessageId?: string;
}

const Messages = memo(
  ({
    messages,
    elements,
    actions,
    indent,
    isRunning,
    scorableRun,
    lastAssistantMessageId
  }: Props) => {
    const messageContext = useContext(MessageContext);

    const lastAssistantMessage = useMemo(() => {
      return messages.findLast((m) => m.type === 'assistant_message');
    }, [messages]);

    const resolvedLastId = useMemo(
      () =>
        lastAssistantMessageId !== undefined
          ? lastAssistantMessageId
          : findLastAssistantMessageIdInTree(messages),
      [lastAssistantMessageId, messages]
    );

    const lastScorableAssistantMessage = useMemo(() => {
      return scorableRun?.steps?.findLast(
        (m) => m.type === 'assistant_message'
      );
    }, [scorableRun]);

    return (
      <>
        {messages.map((m) => {
          // Handle chainlit runs
          if (CL_RUN_NAMES.includes(m.name)) {
            const isRunning = !m.end && !m.isError && messageContext.loading;
            const isToolCallCoT =
              messageContext.cot === 'tool_call' ||
              messageContext.cot === 'full';
            const isHiddenCoT = messageContext.cot === 'hidden';

            const showToolCoTLoader = isToolCallCoT
              ? isRunning && !hasActiveToolStep(m)
              : false;

            const showHiddenCoTLoader = isHiddenCoT
              ? isRunning && !hasAssistantMessage(m)
              : false;
            // Ignore on_chat_start for scorable run
            const scorableRun =
              !isRunning && m.name !== 'on_chat_start' ? m : undefined;
            return (
              <React.Fragment key={m.id}>
                {m.steps?.length ? (
                  <Messages
                    messages={m.steps}
                    elements={elements}
                    actions={actions}
                    indent={indent}
                    isRunning={isRunning}
                    scorableRun={scorableRun}
                    lastAssistantMessageId={resolvedLastId}
                  />
                ) : null}
                {(showToolCoTLoader || showHiddenCoTLoader) &&
                m.name !== 'on_chat_start' ? (
                  <div className="flex gap-4 w-full items-center">
                    <div className="w-5 shrink-0" aria-hidden />
                    <div className="flex-grow min-w-0 flex items-center justify-start">
                      <ThinkingIndicator className="py-2" />
                    </div>
                  </div>
                ) : null}
              </React.Fragment>
            );
          } else {
            // Score the current run
            const _scorableRun = m.type === 'run' ? m : scorableRun;
            // The message is scorable if it is the last assistant message of the run

            const isRunLastAssistantMessage =
              m.type === 'run' ? false : m === lastScorableAssistantMessage;

            const isLastAssistantMessage = m === lastAssistantMessage;

            const isScorable =
              isRunLastAssistantMessage || isLastAssistantMessage;

            return (
              <Message
                message={m}
                elements={elements}
                actions={actions}
                key={m.id}
                indent={indent}
                isRunning={isRunning}
                scorableRun={_scorableRun}
                isScorable={isScorable}
                isLatestMessage={
                  resolvedLastId != null
                    ? m.id === resolvedLastId
                    : m === lastAssistantMessage
                }
                lastAssistantMessageId={resolvedLastId}
              />
            );
          }
        })}
      </>
    );
  }
);

export { Messages };

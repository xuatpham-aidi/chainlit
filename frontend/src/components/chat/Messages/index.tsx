import { MessageContext } from 'contexts/MessageContext';
import React, { memo, useContext, useMemo } from 'react';

import {
  type IAction,
  type IMessageElement,
  type IStep,
  type StepType
} from '@chainlit/react-client';

import { Message } from './Message';

const CL_RUN_NAMES = ['on_chat_start', 'on_message', 'on_audio_end'];
const REASONING_STEP_TYPE: StepType = 'asquad_reasoning';
const ASSISTANT_MESSAGE_TYPE: StepType = 'assistant_message';

const hasAssistantMessage = (step: IStep): boolean => {
  return (
    step.steps?.some(
      (s) => s.type === ASSISTANT_MESSAGE_TYPE || hasAssistantMessage(s)
    ) || false
  );
};

/** Depth-first walk; returns the id of the last assistant_message in the tree. */
function findLastAssistantMessageIdInTree(steps: IStep[]): string | undefined {
  let lastId: string | undefined;
  function walk(list: IStep[]) {
    for (const s of list) {
      if (s.type === ASSISTANT_MESSAGE_TYPE) lastId = s.id;
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
  runStartedAt?: number | string;
}

const Messages = memo(
  ({
    messages,
    elements,
    actions,
    indent,
    isRunning,
    scorableRun,
    lastAssistantMessageId,
    runStartedAt
  }: Props) => {
    const messageContext = useContext(MessageContext);

    const lastAssistantMessage = useMemo(() => {
      return messages.findLast((m) => m.type === ASSISTANT_MESSAGE_TYPE);
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
        (m) => m.type === ASSISTANT_MESSAGE_TYPE
      );
    }, [scorableRun]);

    const thinkingContent = useMemo(() => {
      return messages
        .filter((m) => m.type === REASONING_STEP_TYPE)
        .map((m) => m.output)
        .filter(Boolean)
        .join('\n');
    }, [messages]);

    return (
      <>
        {messages.map((m) => {
          // Handle chainlit runs
          if (CL_RUN_NAMES.includes(m.name)) {
            const isRunning = !m.end && !m.isError && messageContext.loading;
            // Ignore on_chat_start for scorable run
            const scorableRun =
              !isRunning && m.name !== 'on_chat_start' ? m : undefined;
            const showPlaceholder =
              isRunning && !hasAssistantMessage(m) && m.name !== 'on_chat_start';

            const stepsWithPlaceholder = showPlaceholder
              ? [
                ...(m.steps || []),
                {
                  id: `${m.id}-placeholder`,
                  name: '',
                  type: ASSISTANT_MESSAGE_TYPE,
                  output: '',
                  createdAt: m.start || m.createdAt
                } as IStep
              ]
              : m.steps;

            return (
              <React.Fragment key={m.id}>
                {stepsWithPlaceholder?.length ? (
                  <Messages
                    messages={stepsWithPlaceholder}
                    elements={elements}
                    actions={actions}
                    indent={indent}
                    isRunning={isRunning}
                    scorableRun={scorableRun}
                    lastAssistantMessageId={resolvedLastId}
                    runStartedAt={m.start}
                  />
                ) : null}
              </React.Fragment>
            );
          } else {
            if (m.type === REASONING_STEP_TYPE) {
              return <React.Fragment key={m.id} />;
            }

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
                runStartedAt={runStartedAt}
                thinkingContent={
                  m.type === ASSISTANT_MESSAGE_TYPE ? thinkingContent : undefined
                }
              />
            );
          }
        })}
      </>
    );
  }
);

export { Messages };

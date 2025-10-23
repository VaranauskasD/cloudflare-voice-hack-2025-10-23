import { Dispatch, SetStateAction } from 'react';

export type TranscriptChunk = {
  counter: number;
  text: string;
};

export type TranscriptCache = Map<string, Map<number, string>>;

export type ConversationEntry = {
  role: string;
  text: string;
  ts: number;
  turnId?: string;
  chunks?: TranscriptChunk[];
};

type UpdateMessagesArgs = {
  role: 'user' | 'assistant';
  turnId?: string;
  text: string;
  replace?: boolean;
  chunks?: TranscriptChunk[];
  setMessages: Dispatch<SetStateAction<ConversationEntry[]>>;
};

export function updateMessages({ role, turnId, text, replace, chunks, setMessages }: UpdateMessagesArgs) {
  if (!turnId) {
    setMessages((prev) => [
      ...prev,
      {
        role,
        text,
        ts: Date.now(),
        ...(chunks ? { chunks } : {})
      }
    ]);
    return;
  }

  setMessages((prev) => {
    const existingIndex = prev.findIndex((entry) => entry.turnId === turnId && entry.role === role);

    if (existingIndex === -1) {
      return [
        ...prev,
        {
          role,
          text,
          ts: Date.now(),
          turnId,
          ...(chunks ? { chunks } : {})
        }
      ];
    }

    const copy = prev.slice();
    const current = copy[existingIndex];

    copy[existingIndex] = {
      ...current,
      text: replace ? text : current.text + text,
      chunks: chunks ?? current.chunks
    };

    return copy;
  });
}

type HandleUserTranscriptDeltaArgs = {
  message: any;
  cache: TranscriptCache;
  setMessages: Dispatch<SetStateAction<ConversationEntry[]>>;
};

export function handleUserTranscriptDelta({ message, cache, setMessages }: HandleUserTranscriptDeltaArgs) {
  const turnId = message.turn_id as string | undefined;
  const rawDeltaCounter = message.delta_counter;
  const deltaCounterValue =
    typeof rawDeltaCounter === 'number'
      ? rawDeltaCounter
      : rawDeltaCounter != null
        ? Number(rawDeltaCounter)
        : undefined;
  const deltaCounter =
    typeof deltaCounterValue === 'number' && Number.isFinite(deltaCounterValue) ? deltaCounterValue : undefined;
  const content = typeof message.content === 'string' ? message.content : '';

  if (!turnId || deltaCounter === undefined) {
    if (turnId) {
      cache.delete(turnId);
    }

    updateMessages({
      role: 'user',
      turnId,
      text: content,
      replace: true,
      chunks: [],
      setMessages
    });
    return;
  }

  let turnChunks = cache.get(turnId);
  if (!turnChunks) {
    turnChunks = new Map();
    cache.set(turnId, turnChunks);
  }

  turnChunks.set(deltaCounter, content);

  const sortedChunks = Array.from(turnChunks.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([counter, text]) => ({ counter, text }));
  const aggregatedText = sortedChunks.map((chunk) => chunk.text).join('');

  updateMessages({
    role: 'user',
    turnId,
    text: aggregatedText,
    replace: true,
    chunks: sortedChunks,
    setMessages
  });
}

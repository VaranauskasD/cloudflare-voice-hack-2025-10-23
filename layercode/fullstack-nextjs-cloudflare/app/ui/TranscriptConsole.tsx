"use client";

import { useEffect, useRef } from 'react';
import type { ConversationEntry } from '../utils/updateMessages';

export default function TranscriptConsole({ entries }: { entries: ConversationEntry[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [entries]);

  return (
    <div ref={containerRef} className="h-[56vh] overflow-y-auto bg-neutral-950/40">
      <div className="sticky top-0 z-10 bg-neutral-950/70 backdrop-blur-sm border-b border-neutral-800 px-4 py-2 text-xs text-neutral-400 tracking-wider uppercase">
        Events
      </div>
      <ul className="divide-y divide-neutral-800">
        {entries.map((e, i) => (
          <li key={e.turnId ? `${e.turnId}-${e.role}` : `${e.ts}-${i}`} className="px-4 py-3 md:grid md:grid-cols-12 items-start">
            <div className="md:col-span-2 pr-3 text-[11px] text-neutral-500 tabular-nums">{new Date(e.ts).toLocaleTimeString([], { hour12: false })}</div>
            <div className="md:col-span-2 pr-3 mt-1 md:mt-0">
              <span
                className={`px-2 py-0.5 rounded border text-[10px] uppercase tracking-wider ${
                  e.role === 'assistant' ? 'border-cyan-700 text-cyan-300' : e.role === 'user' ? 'border-violet-700 text-violet-300' : 'border-neutral-700 text-gray-400'
                }`}
              >
                {e.role === 'assistant' ? 'Agent' : e.role}
              </span>
            </div>
            <div className={`md:col-span-8 text-sm leading-relaxed text-neutral-200 whitespace-pre-wrap break-words mt-1 md:mt-0 ${e.role === 'data' ? 'font-mono text-[12px] text-neutral-300' : ''}`}>
              {e.role === 'user' && e.chunks?.length
                ? e.chunks.map((chunk) => (
                    <span key={chunk.counter} data-delta-counter={chunk.counter} className="inline whitespace-pre-wrap">
                      {chunk.text}
                    </span>
                  ))
                : e.text}
              {e.turnId ? <div className="mt-1 text-[11px] text-neutral-500">turn_id: {e.turnId}</div> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

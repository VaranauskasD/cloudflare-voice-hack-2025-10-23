import { useCallback, useEffect, useRef } from 'react';

type PlayNotifyOptions = {
  volume?: number;
  preload?: 'auto' | 'metadata' | 'none';
};

export function usePlayNotify(src: string, { volume = 1, preload = 'auto' }: PlayNotifyOptions = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audio.preload = preload;
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [preload, src, volume]);

  return useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch {}
  }, []);
}

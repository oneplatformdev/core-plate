'use client';

import * as React from 'react';

import type { TAudioElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { useMediaState } from '@platejs/media/react';
import { ResizableProvider } from '@platejs/resizable';
import { DownloadIcon, PauseIcon, PlayIcon, Trash2Icon } from 'lucide-react';
import {
  PlateElement,
  useReadOnly,
  useRemoveNodeButton,
  withHOC,
} from 'platejs/react';

import { cn } from '@/lib/utils';
import { formatBytes, formatDuration, formatTime } from '@/lib/file-format';
import { usePlateI18n } from '@/i18n/provider';
import { Caption, CaptionTextarea } from './caption';

type TAudioElementWithMeta = TAudioElement & {
  name?: string;
  size?: number;
};

/** Кастомний аудіоплеєр: play/pause, скрол доріжки, поточний час / тривалість. */
export function AudioPlayer({
  url,
  className,
  downloadName,
}: {
  url?: string;
  className?: string;
  downloadName?: string;
}) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  const toggle = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }, []);

  const onSeek = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = Number(e.target.value);
    audio.currentTime = next;
    setCurrent(next);
  }, []);

  const progress = duration > 0 ? (current / duration) * 100 : 0;
  // The thumb is 12px wide and its centre travels within (track − 12px), so a
  // plain `progress%` fill drifts ±6px from the thumb. Offset by half the thumb
  // width so the listened track lines up with the thumb centre.
  const progressFill = `calc(${progress}% + ${6 - (progress * 12) / 100}px)`;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d)) setDuration(d);
        }}
      />

      <button
        type="button"
        onClick={toggle}
        className="flex size-8 shrink-0 items-center justify-center text-foreground"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? (
          <PauseIcon className="size-5 fill-current" />
        ) : (
          <PlayIcon className="size-5 fill-current" />
        )}
      </button>

      <div className="flex flex-1 flex-col gap-1">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          onChange={onSeek}
          className="op-audio-range h-1 w-full cursor-pointer appearance-none rounded-full outline-none"
          style={{
            background: `linear-gradient(to right, var(--foreground) 0%, var(--foreground) ${progressFill}, var(--muted) ${progressFill}, var(--muted) 100%)`,
          }}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatTime(current)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {url && (
        <a
          href={url}
          download={downloadName}
          rel="noopener noreferrer"
          target="_blank"
          className="flex size-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Download"
        >
          <DownloadIcon className="size-5" />
        </a>
      )}
    </div>
  );
}

/** Рядок метаданих: "Lecture 1.wav · 4 min 35 sec · 5.2 MB". */
export function MediaMeta({
  parts,
  className,
}: {
  parts: Array<string | null | undefined>;
  className?: string;
}) {
  const items = parts.filter(Boolean) as string[];
  if (!items.length) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground',
        className
      )}
    >
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span aria-hidden>·</span>}
          <span>{item}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

export const AudioElement = withHOC(
  ResizableProvider,
  function AudioElement(props: PlateElementProps<TAudioElement>) {
    const { t } = usePlateI18n();
    const readOnly = useReadOnly();
    const { unsafeUrl } = useMediaState();
    const element = props.element as TAudioElementWithMeta;
    const { props: removeButtonProps } = useRemoveNodeButton({ element });

    const [duration, setDuration] = React.useState<number | null>(null);

    // Окремо тягнемо тривалість для рядка метаданих (не залежить від плеєра).
    React.useEffect(() => {
      if (!unsafeUrl) return;
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.src = unsafeUrl;
      const onLoaded = () => {
        if (Number.isFinite(audio.duration)) setDuration(audio.duration);
      };
      audio.addEventListener('loadedmetadata', onLoaded);
      return () => audio.removeEventListener('loadedmetadata', onLoaded);
    }, [unsafeUrl]);

    return (
      <PlateElement {...props} className="my-1">
        <div
          className="group relative rounded-lg border border-border bg-background p-4 pr-10"
          contentEditable={false}
        >
          {!readOnly && (
            <button
              type="button"
              {...removeButtonProps}
              className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-destructive group-hover:opacity-100"
              aria-label={t('caption')}
            >
              <Trash2Icon className="size-4" />
            </button>
          )}

          <Caption style={{ width: '100%' }} align="left">
            <CaptionTextarea
              className="mb-2 text-left text-sm font-medium"
              readOnly={readOnly}
              placeholder={t('writeCaption')}
            />
          </Caption>

          <AudioPlayer url={unsafeUrl} downloadName={element.name} />

          <MediaMeta
            className="mt-2"
            parts={[
              element.name || undefined,
              formatDuration(duration),
              formatBytes(element.size),
            ]}
          />
        </div>
        {props.children}
      </PlateElement>
    );
  }
);

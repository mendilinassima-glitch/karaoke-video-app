import { useEffect, useMemo, useRef, useState } from 'react';
import { KaraokeLine, KaraokeStyle } from '../types/karaoke';
import { getActiveLine } from '../lib/karaokeRenderer';
import { formatProgress } from '../lib/timecode';
import YoutubeScrollRenderer from './YoutubeScrollRenderer';

type Props = {
  videoFile: File | null;
  lines: KaraokeLine[];
  style: KaraokeStyle;
};

export default function KaraokePreview({ videoFile, lines, style }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoError, setVideoError] = useState('');

  const videoUrl = useMemo(
    () => (videoFile ? URL.createObjectURL(videoFile) : ''),
    [videoFile]
  );

  useEffect(() => {
    setCurrentTime(0);
    setVideoError('');
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const activeLine = useMemo(
    () => getActiveLine(lines, currentTime),
    [lines, currentTime]
  );

  const rawProgress = activeLine ? formatProgress(currentTime, activeLine.start, activeLine.end) : 0;
  const wordProgress = Math.min(1, rawProgress * (style.wordSpeed || 1));
  const isWordMode = ['word', 'word-highlight', 'word-sweep', 'word-kf-timed', 'word-wave'].includes(style.flowMode);
  const progress = isWordMode ? wordProgress : rawProgress;
  const highlightWidth = `${Math.round(progress * 100)}%`;
  const words = activeLine?.text.split(/(\s+)/) ?? [];
  const wordCount = words.filter((word) => word.trim()).length;
  const timedWords = useMemo(() => {
    if (!activeLine) return [];
    if (activeLine.wordTimings?.length) return activeLine.wordTimings;
    const visibleWords = activeLine.text.match(/\S+\s*/g) ?? [];
    const lineDuration = Math.max(0.1, activeLine.end - activeLine.start);
    const duration = lineDuration / Math.max(1, visibleWords.length);
    return visibleWords.map((text) => ({ text, duration }));
  }, [activeLine]);
  const elapsedInLine = activeLine ? Math.max(0, currentTime - activeLine.start) * (style.wordSpeed || 1) : 0;
  let timedElapsed = 0;
  const timedWordIndex = timedWords.findIndex((word) => {
    const start = timedElapsed;
    timedElapsed += word.duration;
    return elapsedInLine >= start && elapsedInLine < timedElapsed;
  });
  const activeTimedWordIndex = timedWordIndex === -1 ? Math.max(0, timedWords.length - 1) : timedWordIndex;
  const activeTimedWordStart = timedWords
    .slice(0, activeTimedWordIndex)
    .reduce((sum, word) => sum + word.duration, 0);
  const activeTimedWordDuration = timedWords[activeTimedWordIndex]?.duration ?? 1;
  const activeTimedWordProgress = Math.min(1, Math.max(0, (elapsedInLine - activeTimedWordStart) / activeTimedWordDuration));
  const activeWordIndex = Math.min(
    Math.max(0, Math.floor(wordProgress * Math.max(1, wordCount))),
    Math.max(0, wordCount - 1)
  );
  const activeWordProgress = Math.min(
    1,
    Math.max(0, wordProgress * Math.max(1, wordCount) - activeWordIndex)
  );
  const slideTransform =
    style.flowMode === 'slide-left'
      ? `translateX(${(1 - rawProgress) * 120 - 60}%)`
      : style.flowMode === 'slide-up'
        ? `translateY(${(1 - rawProgress) * 42}px)`
        : undefined;
  const isClassicMode = style.flowMode === 'classic';
  const isYoutubeMode = style.flowMode === 'youtube';

  const renderStandardLine = () => (
    <>
      {isWordMode ? (
        <div className={`karaoke-word-line effect-${style.wordEffect || 'none'} ${style.flowMode === 'word-wave' ? 'is-wave-mode' : ''}`}>
          {(style.flowMode === 'word-kf-timed' ? timedWords.map((word) => word.text) : words).map((word, index) => {
            if (!word.trim()) return <span key={index}>{word}</span>;
            const wordIndex = index;
            const isSweepMode = style.flowMode === 'word-sweep' || style.flowMode === 'word-kf-timed';
            const sweepIndex = style.flowMode === 'word-kf-timed' ? activeTimedWordIndex : activeWordIndex;
            const sweepProgress = style.flowMode === 'word-kf-timed' ? activeTimedWordProgress : activeWordProgress;
            const isSung = isSweepMode ? wordIndex < sweepIndex : wordIndex <= activeWordIndex;
            const isActive = wordIndex === sweepIndex && (style.flowMode === 'word-kf-timed' ? elapsedInLine < timedWords.reduce((sum, item) => sum + item.duration, 0) : wordProgress < 1);
            const wordFill = wordIndex < sweepIndex ? 1 : isActive ? sweepProgress : 0;
            return (
              <span
                key={index}
                className={`${isSung ? 'is-sung' : ''} ${isActive ? 'is-active-word' : ''} ${isSweepMode ? 'is-word-sweep' : ''}`}
                style={{
                  animationDelay: `${Math.min(wordIndex * 24, 160)}ms`,
                  transitionDelay: `${Math.min(wordIndex * 12, 90)}ms`,
                  '--word-fill': wordFill,
                } as React.CSSProperties}
              >
                {isSweepMode && <span className="word-fill" aria-hidden="true">{word}</span>}
                {word}
              </span>
            );
          })}
        </div>
      ) : style.flowMode === 'gradient-background' ? (
        <div className="karaoke-gradient-backdrop">
          <div className="gradient-pass" style={{ transform: `translateX(${rawProgress * 180 - 90}%)` }} />
          <div className="gradient-text">{activeLine?.text}</div>
        </div>
      ) : style.flowMode === 'youtube' ? (
        <YoutubeScrollRenderer line={activeLine} style={style} videoRef={videoRef} />
      ) : (
        <div className={`karaoke-line-container ${isClassicMode || isYoutubeMode ? 'is-special' : ''}`}>
          <div className={`karaoke-line-base ${isClassicMode ? 'is-classic' : ''} ${isYoutubeMode ? 'is-youtube' : ''}`}>
            <span className="karaoke-line-inner">{activeLine?.text}</span>
          </div>
          <div
            className={`karaoke-line-highlight ${isClassicMode ? 'is-classic' : ''} ${isYoutubeMode ? 'is-youtube' : ''}`}
            style={{ width: highlightWidth }}
          >
            <span className="karaoke-line-inner">{activeLine?.text}</span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="video-card">
      <h2>Prévisualisation</h2>
      <div
        className={`preview-frame mode-${style.flowMode}`}
        style={{
          '--base-color': style.baseColor,
          '--highlight-color': style.highlightColor,
          '--outline-color': style.outlineColor,
          '--karaoke-progress': rawProgress,
        } as React.CSSProperties}
      >
        {videoFile ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              onTimeUpdate={(event) => setCurrentTime((event.target as HTMLVideoElement).currentTime)}
              onError={() => setVideoError('Cette vidéo ne peut pas être lue par le navigateur. Essayez un MP4 en H.264 avec audio AAC.')}
            />
            {videoError && <div className="video-error">{videoError}</div>}
            {activeLine && (
              <div className="karaoke-overlay" style={{ alignItems: 'flex-end' }}>
                <div
                  className="karaoke-line-wrapper"
                  style={{
                    fontFamily: style.fontFamily,
                    fontSize: `${style.fontSize}px`,
                    bottom: `${style.verticalPosition}px`,
                    textAlign: style.alignment,
                    transform: slideTransform,
                  }}
                >
                  {renderStandardLine()}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="preview-frame" />
        )}
      </div>
      <div className="status-line">Temps courant : {currentTime.toFixed(2)}s</div>
    </div>
  );
}

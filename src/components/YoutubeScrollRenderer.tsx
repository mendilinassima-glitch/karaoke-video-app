import { useEffect, useRef, useState } from 'react';
import { KaraokeLine, KaraokeStyle } from '../types/karaoke';

type Props = {
  line: KaraokeLine | null;
  style: KaraokeStyle;
  videoRef: React.RefObject<HTMLVideoElement>;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function YoutubeScrollRenderer({ line, style, videoRef }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ containerWidth: 0, textWidth: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const text = textRef.current;
      if (!container || !text) {
        setDimensions({ containerWidth: 0, textWidth: 0 });
        return;
      }

      const containerWidth = Math.round(container.getBoundingClientRect().width);
      const textWidth = Math.round(text.getBoundingClientRect().width);
      setDimensions({ containerWidth, textWidth });
    };

    measure();

    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    if (textRef.current) observer.observe(textRef.current);

    return () => observer.disconnect();
  }, [line?.text, style.fontFamily, style.fontSize]);

  useEffect(() => {
    if (!line) {
      return undefined;
    }

    const animate = () => {
      const container = containerRef.current;
      const text = textRef.current;
      const video = videoRef.current;

      if (container && text && video && dimensions.containerWidth > 0 && dimensions.textWidth > 0) {
        const duration = Math.max(0.01, line.end - line.start);
        const progress = clamp((video.currentTime - line.start) / duration, 0, 1);
        const totalDistance = dimensions.containerWidth + dimensions.textWidth;
        const x = dimensions.containerWidth - progress * totalDistance;
        text.style.transform = `translateX(${x}px)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [line, videoRef, dimensions.containerWidth, dimensions.textWidth]);

  return (
    <div className="youtube-scroll-wrapper">
      <div className="youtube-scroll-track" ref={containerRef}>
        <div
          className="youtube-scroll-text"
          ref={textRef}
          style={{ fontFamily: style.fontFamily, fontSize: `${style.fontSize}px` }}
          aria-hidden="true"
        >
          {line?.text ?? ''}
        </div>
      </div>
    </div>
  );
}

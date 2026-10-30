import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

const POSTER_URL = 'https://media.scrollhaus.ai/sites/zapline/assets/planet-poster.webp?v=2';
const VIDEO_URL = 'https://media.scrollhaus.ai/sites/zapline/assets/planet.mp4?v=2';

export interface PlanetFilmHandle {
  getVideoElement: () => HTMLVideoElement | null;
  pauseVideo: () => void;
}

export const PlanetFilm = forwardRef<PlanetFilmHandle>((_, ref) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  useImperativeHandle(ref, () => ({
    getVideoElement: () => videoRef.current,
    pauseVideo: () => {
      setUserPaused(true);
      videoRef.current?.pause();
    },
  }));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktopQuery = window.matchMedia('(min-width: 900px) and (orientation: landscape)');

    const updateMediaPlayback = () => {
      const isReduced = reducedMotionQuery.matches;
      const isDesktop = desktopQuery.matches;
      const isHidden = document.hidden;

      if (isReduced || !isDesktop || userPaused || isHidden) {
        video.pause();
        return;
      }

      if (!video.src) {
        video.src = VIDEO_URL;
      }

      video
        .play()
        .then(() => setIsReady(true))
        .catch(() => setIsReady(false));
    };

    const handleLoadedData = () => {
      setIsReady(true);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    reducedMotionQuery.addEventListener('change', updateMediaPlayback);
    desktopQuery.addEventListener('change', updateMediaPlayback);
    document.addEventListener('visibilitychange', updateMediaPlayback);

    updateMediaPlayback();

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      reducedMotionQuery.removeEventListener('change', updateMediaPlayback);
      desktopQuery.removeEventListener('change', updateMediaPlayback);
      document.removeEventListener('visibilitychange', updateMediaPlayback);
    };
  }, [userPaused]);

  const togglePause = () => {
    setUserPaused((prev) => {
      const next = !prev;
      const video = videoRef.current;
      if (video) {
        if (next) {
          video.pause();
        } else {
          video.play().catch(() => {});
        }
      }
      return next;
    });
  };

  return (
    <>
      <img
        className="poster"
        src={POSTER_URL}
        alt=""
        aria-hidden="true"
      />
      <video
        ref={videoRef}
        className={`planet ${isReady ? 'ready' : ''}`}
        muted
        playsInline
        loop
        preload="auto"
        poster={POSTER_URL}
        aria-hidden="true"
      />
      <div className="shade" aria-hidden="true" />

      <button
        type="button"
        className="sky-control"
        aria-pressed={userPaused}
        onClick={togglePause}
      >
        {userPaused ? 'Resume planet motion' : 'Pause planet motion'}
      </button>
    </>
  );
});

PlanetFilm.displayName = 'PlanetFilm';

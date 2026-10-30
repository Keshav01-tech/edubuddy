import React, { useState, useEffect, useRef } from 'react';
import './Zapline.css';
import { DialogKey } from './types';
import { StarSky } from './components/StarSky';
import { PlanetFilm, PlanetFilmHandle } from './components/PlanetFilm';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { Dashboard, DashboardHandle } from './components/Dashboard';
import { FeatureModules } from './components/FeatureModules';
import { WorkflowSection } from './components/WorkflowSection';
import { RoiCalculator } from './components/RoiCalculator';
import { ComparisonSection } from './components/ComparisonSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { PricingSection } from './components/PricingSection';
import { FaqSection } from './components/FaqSection';
import { FooterSection } from './components/FooterSection';
import { InfoDialog } from './components/InfoDialog';

declare global {
  interface Window {
    __captureFrame?: (t: number) => Promise<{ time: number }>;
  }
}

export default function ZaplinePage() {
  const [activeDialog, setActiveDialog] = useState<DialogKey | null>(null);
  const planetRef = useRef<PlanetFilmHandle | null>(null);
  const dashboardRef = useRef<DashboardHandle | null>(null);

  // Layout calculations: 1672x941 stage scaling & --extra calculation
  useEffect(() => {
    document.title = "EduBuddy — Bharat's #1 Coaching Institute & Tuition OS";
    const handleLayout = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const s = Math.min(w / 1672, h / 941);
      document.documentElement.style.setProperty('--scale', String(s));
      const extraHeight = Math.max(0, (h - 941 * s) / 2 / s);
      document.documentElement.style.setProperty('--extra', `${extraHeight}px`);
    };

    handleLayout();
    window.addEventListener('resize', handleLayout);
    return () => window.removeEventListener('resize', handleLayout);
  }, []);

  // Capture frame hook for Scrollhaus / Bolt / Lovable automated test harness
  useEffect(() => {
    window.__captureFrame = async (t: number) => {
      planetRef.current?.pauseVideo();
      for (const a of document.getAnimations()) {
        a.pause();
        a.currentTime = t * 1000;
      }
      const video = planetRef.current?.getVideoElement();
      if (video && video.readyState >= 2) {
        const target = t % (video.duration || 1);
        if (Math.abs(video.currentTime - target) > 0.01) {
          await new Promise<void>((resolve) => {
            video.addEventListener('seeked', () => resolve(), { once: true });
            video.currentTime = target;
          });
        }
        return { time: video.currentTime };
      }
      return { time: 0 };
    };

    return () => {
      delete window.__captureFrame;
    };
  }, []);

  const handleOpenDialog = (key: DialogKey) => {
    setActiveDialog(key);
  };

  const handleCloseDialog = () => {
    setActiveDialog(null);
  };

  const handleScrollToTop = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: 0,
      behavior: reduced ? 'instant' : 'smooth',
    });
  };

  const handleExploreDashboardFromDialog = () => {
    dashboardRef.current?.scrollIntoView();
    dashboardRef.current?.focusRange();
  };

  return (
    <div className="zapline-root">
      {/* 1. Procedural Static Stars Canvas */}
      <StarSky />

      {/* 2. Scaled Stage Container (1672x941 centered inside hero-stage-wrapper) */}
      <div className="hero-stage-wrapper">
        <main className="stage">
          {/* Planet Film & Horizon Backdrop */}
          <PlanetFilm ref={planetRef} />

          {/* Navigation Bar */}
          <Navigation
            onOpenDialog={handleOpenDialog}
            onScrollToTop={handleScrollToTop}
          />

          {/* Hero Section */}
          <Hero onOpenDialog={handleOpenDialog} />

          {/* Dashboard Component */}
          <Dashboard
            ref={dashboardRef}
            onOpenDialog={handleOpenDialog}
          />
        </main>
      </div>

      {/* 3. Additional Rich Coaching OS Sections */}
      <div className="landing-sections">
        <FeatureModules onOpenDialog={handleOpenDialog} />
        <WorkflowSection onOpenDialog={handleOpenDialog} />
        <RoiCalculator />
        <ComparisonSection />
        <TestimonialsSection />
        <PricingSection onOpenDialog={handleOpenDialog} />
        <FaqSection />
        <FooterSection onOpenDialog={handleOpenDialog} />
      </div>

      {/* 4. Native Accessible Modal Dialog */}
      <InfoDialog
        activeKey={activeDialog}
        onClose={handleCloseDialog}
        onExploreDashboard={handleExploreDashboardFromDialog}
      />
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from "react";
import { SignalProgress, SCENES } from "./SignalProgress";
import { ProblemScene } from "./scenes/ProblemScene";
import { SignalScene } from "./scenes/SignalScene";
import { DiagnosisScene } from "./scenes/DiagnosisScene";
import { RefactorScene } from "./scenes/RefactorScene";
import { MarketScene } from "./scenes/MarketScene";
import { ExecuteScene } from "./scenes/ExecuteScene";

export function CinematicSceneController() {
  const [activeScene, setActiveScene] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [sceneProgress, setSceneProgress] = useState<number>(0);
  const isTransitioningRef = useRef<boolean>(false);
  const touchStartY = useRef<number | null>(null);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sceneStartTimeRef = useRef<number>(Date.now());

  const triggerInteractionPause = useCallback(() => {
    setIsPaused(true);
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
    // Resume autoplay 2.5s after interaction ceases
    resumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
      sceneStartTimeRef.current = Date.now();
    }, 2500);
  }, []);

  const goToScene = useCallback((target: number) => {
    const clamped = Math.max(0, Math.min(SCENES.length - 1, target));
    setActiveScene(clamped);
    setSceneProgress(0);
    sceneStartTimeRef.current = Date.now();
  }, []);

  // Automatic Scene Progression + Live Progress Tracking
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const currentSceneMeta = SCENES[activeScene];
    if (!currentSceneMeta || currentSceneMeta.duration <= 0) {
      setSceneProgress(1);
      return;
    }

    sceneStartTimeRef.current = Date.now();
    setSceneProgress(0);

    const interval = setInterval(() => {
      if (isPaused) {
        // Adjust start time to pause progression smoothly
        sceneStartTimeRef.current += 50;
        return;
      }

      const elapsed = Date.now() - sceneStartTimeRef.current;
      const progress = Math.min(1, elapsed / currentSceneMeta.duration);
      setSceneProgress(progress);

      if (elapsed >= currentSceneMeta.duration) {
        if (activeScene < SCENES.length - 1) {
          goToScene(activeScene + 1);
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [activeScene, isPaused, goToScene]);

  // Wheel / Trackpad Scroll Controller with Throttle
  useEffect(() => {
    let wheelTimeout: NodeJS.Timeout;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 25 || isTransitioningRef.current) return;

      triggerInteractionPause();
      isTransitioningRef.current = true;
      if (e.deltaY > 0) {
        goToScene(activeScene + 1);
      } else {
        goToScene(activeScene - 1);
      }

      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        isTransitioningRef.current = false;
      }, 550);
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      clearTimeout(wheelTimeout);
    };
  }, [activeScene, goToScene, triggerInteractionPause]);

  // Touch Swipe Controller for Mobile/Tablet
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      triggerInteractionPause();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartY.current === null || isTransitioningRef.current) return;
      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(deltaY) > 40) {
        isTransitioningRef.current = true;
        if (deltaY > 0) {
          goToScene(activeScene + 1);
        } else {
          goToScene(activeScene - 1);
        }
        setTimeout(() => {
          isTransitioningRef.current = false;
        }, 500);
      }
      touchStartY.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [activeScene, goToScene, triggerInteractionPause]);

  // Keyboard Navigation (Arrow Keys, PageUp/Down, Home/End, 1-6)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (
        [
          "ArrowDown",
          "ArrowUp",
          "PageDown",
          "PageUp",
          "Home",
          "End",
          " ",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
        ].includes(e.key)
      ) {
        triggerInteractionPause();
      }

      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        goToScene(activeScene + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goToScene(activeScene - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goToScene(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goToScene(SCENES.length - 1);
      } else if (["1", "2", "3", "4", "5", "6"].includes(e.key)) {
        goToScene(parseInt(e.key, 10) - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeScene, goToScene, triggerInteractionPause]);

  return (
    <div
      onPointerDown={triggerInteractionPause}
      className="relative w-full h-[calc(100svh-56px)] sm:h-[calc(100svh-64px)] overflow-hidden bg-[#11110F] text-[#F3F0E8] select-none"
    >
      {/* Subtle textured grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(243, 240, 232, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(243, 240, 232, 0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 90%)",
        }}
      />

      {/* Subtle Horizontal Progress Indicator */}
      <SignalProgress
        activeScene={activeScene}
        onSelectScene={(id) => {
          triggerInteractionPause();
          goToScene(id);
        }}
        sceneProgress={sceneProgress}
      />

      {/* Viewport Scene Container: mount ONLY the active scene. Previously
      all 6 scenes stayed mounted with opacity toggling, so the landing
      page paid 6x DOM + animation cost on first paint. key={activeScene}
      re-triggers the enter transition per scene. Scenes are light DOM
      (no three.js), so no lazy split needed here. */}
      <div className="relative w-full h-full">
        <div
          key={activeScene}
          className="absolute inset-0 transition-all duration-500 ease-out opacity-100 translate-y-0 pointer-events-auto z-10"
        >
          {activeScene === 0 && <ProblemScene />}
          {activeScene === 1 && <SignalScene />}
          {activeScene === 2 && <DiagnosisScene />}
          {activeScene === 3 && <RefactorScene />}
          {activeScene === 4 && <MarketScene />}
          {activeScene === 5 && <ExecuteScene />}
        </div>
      </div>
    </div>
  );
}

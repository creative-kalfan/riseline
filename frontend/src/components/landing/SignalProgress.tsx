import React from "react";

export interface SceneMeta {
  id: number;
  slug: string;
  name: string;
  duration: number; // ms for auto progression
}

export const SCENES: SceneMeta[] = [
  { id: 0, slug: "problem", name: "The Problem", duration: 5500 },
  { id: 1, slug: "understand", name: "Understand the Job", duration: 7500 },
  { id: 2, slug: "diagnose", name: "Diagnose Fit", duration: 7500 },
  { id: 3, slug: "optimize", name: "Optimize", duration: 9000 },
  { id: 4, slug: "discover", name: "Discover", duration: 6500 },
  { id: 5, slug: "decide", name: "Decide", duration: 0 },
];

interface SignalProgressProps {
  activeScene: number;
  onSelectScene: (sceneId: number) => void;
  sceneProgress?: number; // 0 to 1
}

export function SignalProgress({
  activeScene,
  onSelectScene,
  sceneProgress = 0,
}: SignalProgressProps) {
  return (
    <nav
      aria-label="Experience Progress"
      className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-xs sm:max-w-md px-4 pointer-events-auto"
    >
      <div className="flex items-center gap-1.5 sm:gap-2 w-full p-1 sm:p-1.5 rounded-full bg-[#1A1916]/80 border border-[#302E29]/80 backdrop-blur-md shadow-lg">
        {SCENES.map((scene) => {
          const isPassed = scene.id < activeScene;
          const isCurrent = scene.id === activeScene;
          const isFinal = scene.id === SCENES.length - 1;

          return (
            <button
              key={scene.id}
              onClick={() => onSelectScene(scene.id)}
              aria-label={`Jump to: ${scene.name}`}
              className="group relative flex-1 h-1.5 sm:h-2 rounded-full overflow-hidden bg-[#302E29]/60 hover:bg-[#302E29] transition-colors cursor-pointer focus:outline-hidden"
            >
              {/* Tooltip on hover */}
              <span className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-0.5 rounded bg-[#1A1916] border border-[#302E29] text-[10px] text-[#F3F0E8] whitespace-nowrap shadow-md z-50">
                {scene.name}
              </span>

              {/* Progress Fill */}
              <div
                className={`h-full rounded-full transition-all ${
                  isPassed
                    ? "w-full bg-[#A8A49A]/80"
                    : isCurrent
                      ? "bg-[#315CFF]"
                      : "w-0 bg-transparent"
                }`}
                style={
                  isCurrent && !isFinal && scene.duration > 0
                    ? {
                        width: `${Math.min(100, Math.max(0, sceneProgress * 100))}%`,
                        transition: "width 80ms linear",
                      }
                    : isCurrent
                      ? { width: "100%" }
                      : undefined
                }
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

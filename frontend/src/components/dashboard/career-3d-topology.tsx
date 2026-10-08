"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import {
  Compass,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  Maximize2,
  TrendingUp,
  Cpu,
  Target,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SkillNode {
  name: string;
  category: "core" | "ats" | "market" | "emerging";
  level: number; // 0 - 100
  marketDemand: number; // 0 - 100
  impact?: string;
}

const DEFAULT_NODES: SkillNode[] = [
  {
    name: "TypeScript",
    category: "core",
    level: 94,
    marketDemand: 96,
    impact: "Core foundation across 85% of target roles",
  },
  {
    name: "React / TanStack",
    category: "core",
    level: 95,
    marketDemand: 92,
    impact: "Primary frontend architectural stack",
  },
  {
    name: "Python / FastAPI",
    category: "core",
    level: 88,
    marketDemand: 89,
    impact: "High backend & data pipeline synergy",
  },
  {
    name: "PostgreSQL / RLS",
    category: "core",
    level: 85,
    marketDemand: 84,
    impact: "Database integrity & security benchmark",
  },
  {
    name: "System Architecture",
    category: "ats",
    level: 86,
    marketDemand: 95,
    impact: "Key differentiator for Senior / Staff tiers",
  },
  {
    name: "ATS Optimization",
    category: "ats",
    level: 92,
    marketDemand: 88,
    impact: "Maximizes recruiter screening throughput",
  },
  {
    name: "Distributed Systems",
    category: "market",
    level: 80,
    marketDemand: 94,
    impact: "High demand across scale-up engineering teams",
  },
  {
    name: "Cloud / Docker / K8s",
    category: "core",
    level: 84,
    marketDemand: 91,
    impact: "DevOps & cloud delivery capability",
  },
  {
    name: "AI & LLM Workflows",
    category: "emerging",
    level: 88,
    marketDemand: 98,
    impact: "Exponential growth multiplier (+42% demand YoY)",
  },
  {
    name: "Performance & WebGL",
    category: "emerging",
    level: 82,
    marketDemand: 79,
    impact: "Spatial computing & interactive rendering mastery",
  },
];

const categoryMeta: Record<
  SkillNode["category"],
  { label: string; color: number; hex: string; badge: string }
> = {
  core: {
    label: "Core Stack",
    color: 0x38bdf8,
    hex: "#38bdf8",
    badge: "border-sky-500/30 text-sky-400 bg-sky-500/10",
  },
  ats: {
    label: "ATS Weight",
    color: 0x34d399,
    hex: "#34d399",
    badge: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
  },
  market: {
    label: "Market Velocity",
    color: 0xfbbf24,
    hex: "#fbbf24",
    badge: "border-amber-500/30 text-amber-400 bg-amber-500/10",
  },
  emerging: {
    label: "Emerging Tech",
    color: 0xc084fc,
    hex: "#c084fc",
    badge: "border-purple-500/30 text-purple-400 bg-purple-500/10",
  },
};

export function Career3DTopology({
  nodes = DEFAULT_NODES,
  careerScore = 88,
  compact = false,
  className,
}: {
  nodes?: SkillNode[];
  careerScore?: number;
  compact?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SkillNode | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | SkillNode["category"]>("all");
  const [use2DFallback, setUse2DFallback] = useState(false);
  const [fps, setFps] = useState(60);

  // Check reduced motion
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setUse2DFallback(true);
    }
  }, []);

  const filteredNodes = useMemo(() => {
    if (activeFilter === "all") return nodes;
    return nodes.filter((n) => n.category === activeFilter);
  }, [nodes, activeFilter]);

  useEffect(() => {
    if (use2DFallback || !containerRef.current) return;

    const container = containerRef.current;
    let renderer: THREE.WebGLRenderer | null = null;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setUse2DFallback(true);
      return;
    }

    const width = container.clientWidth || (compact ? 360 : 640);
    const height = compact ? 280 : 400;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const blueLight = new THREE.PointLight(0x38bdf8, 3, 25);
    blueLight.position.set(5, 6, 6);
    scene.add(blueLight);

    const violetLight = new THREE.PointLight(0xa855f7, 2.5, 25);
    violetLight.position.set(-6, -4, 4);
    scene.add(violetLight);

    // Constellation Group
    const constellationGroup = new THREE.Group();
    scene.add(constellationGroup);

    // Central Core Wireframe Orb
    const coreGeo = new THREE.IcosahedronGeometry(0.9, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.85,
      wireframe: true,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    constellationGroup.add(coreMesh);

    // Core Solid Inner Core
    const innerCoreGeo = new THREE.SphereGeometry(0.5, 24, 24);
    const innerCoreMat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      emissive: 0x2563eb,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.9,
    });
    const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    constellationGroup.add(innerCore);

    // Glow Aura
    const glowGeo = new THREE.SphereGeometry(1.05, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.14,
      wireframe: false,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    constellationGroup.add(glowMesh);

    // Background Particle Stars
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 16;
      particlePositions[i + 1] = (Math.random() - 0.5) * 16;
      particlePositions[i + 2] = (Math.random() - 0.5) * 12 - 2;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x64748b,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    scene.add(particlePoints);

    // Orbit Rings
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x475569,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    });

    const orbit1Geo = new THREE.RingGeometry(2.35, 2.38, 64);
    const orbit1 = new THREE.Mesh(orbit1Geo, ringMat);
    orbit1.rotation.x = Math.PI / 2.3;
    constellationGroup.add(orbit1);

    const orbit2Geo = new THREE.RingGeometry(3.4, 3.43, 64);
    const orbit2 = new THREE.Mesh(orbit2Geo, ringMat);
    orbit2.rotation.x = -Math.PI / 3.2;
    orbit2.rotation.y = Math.PI / 5;
    constellationGroup.add(orbit2);

    // Node Meshes & Connecting Lines
    const nodeMeshes: {
      mesh: THREE.Mesh;
      nodeData: SkillNode;
      origPos: THREE.Vector3;
      mat: THREE.MeshStandardMaterial;
    }[] = [];
    const sphereGeo = new THREE.SphereGeometry(0.18, 20, 20);

    const lineGeos: THREE.BufferGeometry[] = [];
    const lineMats: THREE.LineBasicMaterial[] = [];

    const totalNodes = nodes.length;
    const phi = Math.PI * (3 - Math.sqrt(5));

    nodes.forEach((node, i) => {
      const y = 1 - (i / (totalNodes - 1 || 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const r = 2.4 + (node.level / 100) * 0.9;
      const x = Math.cos(theta) * radiusAtY * r;
      const z = Math.sin(theta) * radiusAtY * r;
      const pos = new THREE.Vector3(x, y * r, z);

      const meta = categoryMeta[node.category] || categoryMeta.core;
      const isDimmed = activeFilter !== "all" && node.category !== activeFilter;

      const nodeMat = new THREE.MeshStandardMaterial({
        color: meta.color,
        emissive: meta.color,
        emissiveIntensity: isDimmed ? 0.1 : 0.6,
        roughness: 0.2,
        metalness: 0.7,
        transparent: true,
        opacity: isDimmed ? 0.3 : 1.0,
      });

      const nodeMesh = new THREE.Mesh(sphereGeo, nodeMat);
      nodeMesh.position.copy(pos);
      nodeMesh.userData = { nodeData: node };
      constellationGroup.add(nodeMesh);

      // Connecting vector from core to node
      const lineMat = new THREE.LineBasicMaterial({
        color: meta.color,
        transparent: true,
        opacity: isDimmed ? 0.08 : 0.28,
      });
      const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), pos]);
      const line = new THREE.Line(lineGeo, lineMat);
      constellationGroup.add(line);

      lineGeos.push(lineGeo);
      lineMats.push(lineMat);
      nodeMeshes.push({ mesh: nodeMesh, nodeData: node, origPos: pos, mat: nodeMat });
    });

    // Interaction Raycaster & Mouse Drag
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handlePointerMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = event.clientX - prevMouseX;
        const deltaY = event.clientY - prevMouseY;
        constellationGroup.rotation.y += deltaX * 0.007;
        constellationGroup.rotation.x += deltaY * 0.007;
        prevMouseX = event.clientX;
        prevMouseY = event.clientY;
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      isDragging = true;
      prevMouseX = event.clientX;
      prevMouseY = event.clientY;
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const handleClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes.map((n) => n.mesh));
      if (intersects.length > 0) {
        const hit = intersects[0].object.userData.nodeData as SkillNode;
        setSelectedNode((curr) => (curr?.name === hit.name ? null : hit));
      }
    };

    container.addEventListener("mousemove", handlePointerMove);
    container.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("mouseup", handlePointerUp);
    container.addEventListener("click", handleClick);

    // RAF Loop with dynamic FPS estimation & IntersectionObserver
    let isVisible = true;
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.1 },
    );
    intersectionObserver.observe(container);

    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      frameCount++;
      if (now - lastFpsUpdate >= 800) {
        const calculatedFps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
        setFps(Math.min(60, Math.max(30, calculatedFps)));
        frameCount = 0;
        lastFpsUpdate = now;
      }

      if (!isDragging) {
        constellationGroup.rotation.y += delta * 0.2;
        constellationGroup.rotation.x += delta * 0.06;
      }
      coreMesh.rotation.y += delta * 0.35;
      coreMesh.rotation.z += delta * 0.18;
      innerCore.rotation.y -= delta * 0.4;
      particlePoints.rotation.y -= delta * 0.03;

      // Raycast hover check
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes.map((n) => n.mesh));
      if (intersects.length > 0) {
        const hit = intersects[0].object.userData.nodeData as SkillNode;
        setHoveredNode(hit);
        container.style.cursor = "pointer";
      } else {
        setHoveredNode(null);
        container.style.cursor = isDragging ? "grabbing" : "grab";
      }

      renderer?.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || width;
      const h = compact ? 280 : 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      container.removeEventListener("mousemove", handlePointerMove);
      container.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("mouseup", handlePointerUp);
      container.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);

      coreGeo.dispose();
      coreMat.dispose();
      innerCoreGeo.dispose();
      innerCoreMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      orbit1Geo.dispose();
      orbit2Geo.dispose();
      ringMat.dispose();
      sphereGeo.dispose();
      particleGeo.dispose();
      particleMat.dispose();

      lineGeos.forEach((g) => g.dispose());
      lineMats.forEach((m) => m.dispose());

      nodeMeshes.forEach((n) => {
        n.mat.dispose();
      });

      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
      }
      container.innerHTML = "";
    };
  }, [use2DFallback, nodes, compact, activeFilter]);

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-lg border-2 border-border bg-surface shadow-brutal-md",
        className,
      )}
    >
      {/* Cockpit HUD Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-border bg-surface-elevated px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              3D Career Vector & Skill Topology
            </h3>
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/10 font-mono text-[10px] font-bold text-primary"
            >
              WEBGL 2.0 • {fps} FPS
            </Badge>
          </div>
        </div>

        {/* HUD Controls */}
        <div className="flex items-center gap-2">
          {/* Category Filter Pills */}
          <div className="hidden sm:flex items-center gap-1 rounded-md border-2 border-border bg-surface p-0.5 shadow-brutal-xs">
            {(["all", "core", "ats", "market", "emerging"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "rounded-sm px-2 py-0.5 text-[10px] font-mono uppercase transition-colors cursor-pointer",
                  activeFilter === filter
                    ? "bg-primary text-primary-foreground font-bold border border-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated border border-transparent",
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            aria-label={use2DFallback ? "Switch to 3D Sphere" : "Switch to 2D Matrix"}
            onClick={() => setUse2DFallback(!use2DFallback)}
            className="h-7 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
          >
            <Layers className="mr-1.5 h-3.5 w-3.5 text-primary" />
            {use2DFallback ? "Switch to 3D Sphere" : "Switch to 2D Matrix"}
          </Button>
        </div>
      </div>

      {/* Main Visual Canvas Area */}
      <div className="relative flex min-h-[360px] w-full grow items-center justify-center p-2">
        {use2DFallback ? (
          /* 2D Structured Matrix Fallback */
          <div className="grid w-full grid-cols-1 gap-2.5 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNodes.map((n) => {
              const meta = categoryMeta[n.category];
              const isSelected = selectedNode?.name === n.name;
              return (
                <div
                  key={n.name}
                  onClick={() => setSelectedNode(isSelected ? null : n)}
                  className={cn(
                    "cursor-pointer rounded-lg border p-3 transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-elevation-1"
                      : "border-border/70 bg-surface-instrument hover:border-border hover:bg-surface-elevated",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{n.name}</span>
                    <Badge
                      variant="outline"
                      className={cn("text-[9px] font-mono uppercase", meta.badge)}
                    >
                      {meta.label}
                    </Badge>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                    <span>Proficiency: {n.level}%</span>
                    <span>Market: {n.marketDemand}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${n.level}%`, backgroundColor: meta.hex }}
                    />
                  </div>
                  {n.impact && (
                    <p className="mt-2 line-clamp-1 text-[10px] text-muted-foreground/90">
                      {n.impact}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* 3D WebGL Canvas */
          <div
            ref={containerRef}
            className="h-[380px] w-full select-none cursor-grab active:cursor-grabbing"
          />
        )}

        {/* Live Cockpit Vector HUD Overlay */}
        {!use2DFallback && (
          <div className="pointer-events-none absolute bottom-3 left-3 flex flex-col gap-1.5 rounded-lg border border-border/80 bg-background/85 p-3 backdrop-blur-md shadow-elevation-2 max-w-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Compass className="h-4 w-4 text-primary animate-spin-slow" />
                <span>Career Vector Momentum</span>
              </div>
              <span className="font-mono text-xs font-bold text-primary">{careerScore}%</span>
            </div>

            {hoveredNode || selectedNode ? (
              <div className="mt-1 border-t border-border/50 pt-1.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground">
                    {(selectedNode || hoveredNode)?.name}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] font-mono",
                      categoryMeta[(selectedNode || hoveredNode)!.category].badge,
                    )}
                  >
                    {categoryMeta[(selectedNode || hoveredNode)!.category].label}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
                  <span>Match: {(selectedNode || hoveredNode)?.level}%</span>
                  <span>Demand: {(selectedNode || hoveredNode)?.marketDemand}%</span>
                </div>
                {(selectedNode || hoveredNode)?.impact && (
                  <p className="mt-1 text-[10px] text-muted-foreground leading-tight">
                    {(selectedNode || hoveredNode)?.impact}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground">
                Drag to rotate constellation • Hover/Click node to inspect telemetry
              </p>
            )}
          </div>
        )}
      </div>

      {/* Selected Node Telemetry Bay */}
      {selectedNode && (
        <div className="border-t border-border/80 bg-surface-instrument/95 p-3.5 px-4 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg border border-success/30 bg-success/10 text-success">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">{selectedNode.name}</span>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] font-mono", categoryMeta[selectedNode.category].badge)}
                >
                  {categoryMeta[selectedNode.category].label}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {selectedNode.impact || "Validated career alignment benchmark."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 font-mono text-xs text-muted-foreground">
              <span>
                Proficiency: <strong className="text-foreground">{selectedNode.level}%</strong>
              </span>
              <span>•</span>
              <span>
                Velocity: <strong className="text-primary">{selectedNode.marketDemand}%</strong>
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedNode(null)}
              className="h-7 text-xs rounded-lg border-border/70 hover:bg-surface-elevated"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

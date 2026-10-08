import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface NodeData {
  id: number;
  label: string;
  sublabel: string;
  tag: string;
  color: number;
  colorHex: string;
  pos: [number, number, number];
  metric: string;
  metricLabel: string;
}

export const NODES_DATA: NodeData[] = [
  {
    id: 0,
    label: "Target Role Signal",
    sublabel: "Job Description Ingestion",
    tag: "01_INGEST",
    color: 0x3b82f6,
    colorHex: "#3B82F6",
    pos: [-4.2, 0.4, 0],
    metric: "18 Keywords",
    metricLabel: "Extracted Target Criteria",
  },
  {
    id: 1,
    label: "Resume Core",
    sublabel: "8-Factor Profile Extraction",
    tag: "02_PARSER",
    color: 0x8b5cf6,
    colorHex: "#8B5CF6",
    pos: [-2.1, -1.1, 0.6],
    metric: "42% Match",
    metricLabel: "Initial Baseline Alignment",
  },
  {
    id: 2,
    label: "ATS Alignment",
    sublabel: "Semantic Gap Analysis",
    tag: "03_DIAGNOSTICS",
    color: 0xf59e0b,
    colorHex: "#F59E0B",
    pos: [0, 1.2, -0.4],
    metric: "-4 Critical Gaps",
    metricLabel: "Missing Experience Vectors",
  },
  {
    id: 3,
    label: "Version Optimizer",
    sublabel: "Targeted Diff Synthesis",
    tag: "04_OPTIMIZE",
    color: 0x6366f1,
    colorHex: "#6366F1",
    pos: [2.1, -0.8, 0.4],
    metric: "+38% Score Lift",
    metricLabel: "Version-Safe Suggestions",
  },
  {
    id: 4,
    label: "Application Matrix",
    sublabel: "Tailored PDF & Pipeline",
    tag: "05_EXECUTE",
    color: 0x10b981,
    colorHex: "#10B981",
    pos: [4.2, 0.6, 0],
    metric: "94% Confidence",
    metricLabel: "Interview-Ready State",
  },
];

interface CareerSignalCanvasProps {
  activeNode: number;
  onSelectNode: (nodeId: number) => void;
}

export function CareerSignalCanvas({ activeNode, onSelectNode }: CareerSignalCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const activeNodeRef = useRef(activeNode);
  activeNodeRef.current = activeNode;
  const hoveredNodeRef = useRef<number | null>(null);
  const onSelectNodeRef = useRef(onSelectNode);
  onSelectNodeRef.current = onSelectNode;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let scene: THREE.Scene | null = new THREE.Scene();
    const width = container.clientWidth;
    const height = container.clientHeight;

    let camera: THREE.PerspectiveCamera | null = new THREE.PerspectiveCamera(
      42,
      width / height,
      0.1,
      100,
    );
    camera.position.set(0, 0.5, 9.5);

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    } catch {
      setWebglSupported(false);
      return;
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x3b82f6, 2, 20);
    pointLight.position.set(0, 3, 4);
    scene.add(pointLight);

    const nodeMeshes: THREE.Group[] = [];
    const hitSpheres: THREE.Mesh[] = [];
    const sharedSphereGeo = new THREE.SphereGeometry(0.42, 24, 24);
    const sharedOuterGeo = new THREE.IcosahedronGeometry(0.68, 1);
    const sharedRingGeo = new THREE.RingGeometry(0.82, 0.88, 32);

    NODES_DATA.forEach((node) => {
      const group = new THREE.Group();
      group.position.set(node.pos[0], node.pos[1], node.pos[2]);
      group.userData = { nodeId: node.id };

      const coreMat = new THREE.MeshStandardMaterial({
        color: node.color,
        emissive: node.color,
        emissiveIntensity: 0.65,
        roughness: 0.2,
        metalness: 0.8,
      });
      const coreMesh = new THREE.Mesh(sharedSphereGeo, coreMat);
      group.add(coreMesh);

      const outerMat = new THREE.MeshBasicMaterial({
        color: node.color,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
      const outerMesh = new THREE.Mesh(sharedOuterGeo, outerMat);
      outerMesh.name = "outerWire";
      group.add(outerMesh);

      const ringMat = new THREE.MeshBasicMaterial({
        color: node.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25,
      });
      const ringMesh = new THREE.Mesh(sharedRingGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 3;
      ringMesh.name = "orbitRing";
      group.add(ringMesh);

      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(new THREE.SphereGeometry(0.85, 8, 8), hitMat);
      hitMesh.userData = { nodeId: node.id };
      group.add(hitMesh);
      hitSpheres.push(hitMesh);

      scene!.add(group);
      nodeMeshes.push(group);
    });

    const curvePoints = NODES_DATA.map((n) => new THREE.Vector3(...n.pos));
    const pipelineCurve = new THREE.CatmullRomCurve3(curvePoints, false, "catmullrom", 0.3);

    const tubeGeo = new THREE.TubeGeometry(pipelineCurve, 64, 0.03, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.5,
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(tubeMesh);

    const PARTICLE_COUNT = 36;
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleColors = new Float32Array(PARTICLE_COUNT * 3);
    const particleProgress: number[] = [];

    const baseColorA = new THREE.Color(0x3b82f6);
    const baseColorB = new THREE.Color(0x10b981);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = i / PARTICLE_COUNT;
      particleProgress.push(p);
      const pos = pipelineCurve.getPoint(p);
      particlePositions[i * 3] = pos.x;
      particlePositions[i * 3 + 1] = pos.y;
      particlePositions[i * 3 + 2] = pos.z;

      const c = baseColorA.clone().lerp(baseColorB, p);
      particleColors[i * 3] = c.r;
      particleColors[i * 3 + 1] = c.g;
      particleColors[i * 3 + 2] = c.b;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    const pCanvas = document.createElement("canvas");
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext("2d");
    if (pCtx) {
      const grad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.3, "rgba(200,225,255,0.8)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, 32, 32);
    }
    const pTex = new THREE.CanvasTexture(pCanvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.22,
      map: pTex,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particlePoints = new THREE.Points(particleGeo, particleMat);
    scene.add(particlePoints);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(-100, -100);
    const targetCameraPos = new THREE.Vector3(0, 0.5, 9.5);
    const currentCameraPos = camera.position.clone();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      targetCameraPos.x = pointer.x * 0.4;
      targetCameraPos.y = 0.5 + pointer.y * 0.3;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const clickY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(clickX, clickY), camera!);
      const intersects = raycaster.intersectObjects(hitSpheres);
      if (intersects.length > 0) {
        const id = intersects[0].object.userData.nodeId;
        if (typeof id === "number") {
          onSelectNodeRef.current(id);
        }
      }
    };

    container.addEventListener("mousemove", handlePointerMove);
    container.addEventListener("click", handleClick);

    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    let isVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.1 },
    );
    observer.observe(container);

    let animationFrameId: number;
    const startTime = performance.now();
    let lastTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible || !scene || !camera || !renderer) return;

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      const elapsed = (now - startTime) / 1000;
      lastTime = now;

      if (!prefersReducedMotion) {
        currentCameraPos.lerp(targetCameraPos, 0.05);
        camera.position.copy(currentCameraPos);
        camera.lookAt(0, 0, 0);
      }

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(hitSpheres);
      if (intersects.length > 0) {
        const id = intersects[0].object.userData.nodeId;
        hoveredNodeRef.current = id;
        canvas.style.cursor = "pointer";
      } else {
        hoveredNodeRef.current = null;
        canvas.style.cursor = "default";
      }

      const curActive = activeNodeRef.current;
      const curHovered = hoveredNodeRef.current;

      nodeMeshes.forEach((group, idx) => {
        const isActive = idx === curActive;
        const isHovered = idx === curHovered;

        const outerWire = group.getObjectByName("outerWire") as THREE.Mesh;
        const orbitRing = group.getObjectByName("orbitRing") as THREE.Mesh;

        if (outerWire && !prefersReducedMotion) {
          outerWire.rotation.y += (isActive ? 0.025 : 0.008) * (idx % 2 === 0 ? 1 : -1);
          outerWire.rotation.x += 0.005;
        }

        if (orbitRing && !prefersReducedMotion) {
          orbitRing.rotation.z += (isActive ? 0.03 : 0.01) * (idx % 2 === 0 ? -1 : 1);
        }

        const targetScale = isActive ? 1.25 : isHovered ? 1.15 : 1.0;
        group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

        if (!prefersReducedMotion) {
          const floatOffset = Math.sin(elapsed * 1.5 + idx * 1.2) * 0.08;
          group.position.y = NODES_DATA[idx].pos[1] + floatOffset;
        }
      });

      if (!prefersReducedMotion) {
        const posAttr = particleGeo.getAttribute("position") as THREE.BufferAttribute;
        const speed = 0.08;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          particleProgress[i] = (particleProgress[i] + speed * delta) % 1.0;
          const p = pipelineCurve.getPoint(particleProgress[i]);
          posAttr.setXYZ(i, p.x, p.y, p.z);
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", handlePointerMove);
      container.removeEventListener("click", handleClick);

      scene?.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh || (obj as THREE.Points).isPoints) {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        }
      });

      sharedSphereGeo.dispose();
      sharedOuterGeo.dispose();
      sharedRingGeo.dispose();
      tubeGeo.dispose();
      particleGeo.dispose();
      pTex.dispose();

      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
      }
      scene = null;
      camera = null;
      renderer = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[420px] sm:h-[480px] lg:h-[520px] rounded-lg overflow-hidden border-2 border-border bg-surface shadow-brutal-md"
    >
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between text-[11px] font-mono text-muted-foreground border-b-2 border-border pb-2 bg-surface/90">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-background" />
          <span className="text-foreground font-bold tracking-wider">
            CAREEROS FLIGHT VECTOR
          </span>
          <span className="text-muted-foreground hidden sm:inline font-mono">| REALTIME_TOPOLOGY</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-muted-foreground font-mono">
            INTERACTIVE 3D WEBGL NODE MAP
          </span>
          <span className="px-2 py-0.5 rounded-sm bg-primary/20 border border-primary text-primary font-mono font-bold text-[10px]">
            ACTIVE: {NODES_DATA[activeNode].tag}
          </span>
        </div>
      </div>

      {webglSupported ? (
        <canvas
          ref={canvasRef}
          className="w-full h-full block touch-none focus:outline-hidden"
          tabIndex={0}
          role="region"
          aria-label="Interactive 3D Career Signal Network. Use node controls below to navigate stages."
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-3">
            <p className="text-sm text-foreground font-semibold">2D Signal Topology</p>
            <div className="flex flex-wrap justify-center gap-2">
              {NODES_DATA.map((node) => (
                <button
                  key={node.id}
                  onClick={() => onSelectNode(node.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition ${
                    activeNode === node.id
                      ? "border-primary bg-primary/20 text-foreground"
                      : "border-border bg-surface text-muted-foreground"
                  }`}
                >
                  {node.label} ({node.metric})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface/90 backdrop-blur-md border border-border/80 rounded-xl p-3.5 shadow-xl">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm text-white shrink-0 shadow-md"
            style={{ backgroundColor: NODES_DATA[activeNode].colorHex }}
          >
            0{activeNode + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground tracking-tight">
                {NODES_DATA[activeNode].label}
              </h4>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated border border-border/60 text-muted-foreground">
                {NODES_DATA[activeNode].tag}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {NODES_DATA[activeNode].sublabel}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
          <div className="text-right">
            <div className="text-xs font-mono font-bold text-foreground">
              {NODES_DATA[activeNode].metric}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {NODES_DATA[activeNode].metricLabel}
            </div>
          </div>
          <div className="flex gap-1">
            {NODES_DATA.map((n) => (
              <button
                key={n.id}
                onClick={() => onSelectNode(n.id)}
                aria-label={`Select ${n.label}`}
                className={`w-7 h-7 rounded-md text-xs font-mono flex items-center justify-center transition ${
                  activeNode === n.id
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-surface-elevated hover:bg-surface text-muted-foreground hover:text-foreground border border-border/60"
                }`}
              >
                {n.id + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

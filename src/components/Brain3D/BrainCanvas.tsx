'use client';

import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RG, TR, NTC, type BrainRegion, type Tract } from '@/data/brainRegions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BrainCanvasProps {
  activeDrugs: Record<string, number>;
  selectedRegion: string | null;
  selectedDeficit: string | null;
  onRegionClick: (id: string | null, screenPos?: { x: number; y: number }) => void;
  onRegionHover: (id: string | null, event?: MouseEvent) => void;
  /** Overall brain‑mesh opacity override (0‑1). Defaults to 0.15 */
  opacity?: number;
  /** Whether the right panel is open (used for resize calc) */
  rightPanelOpen?: boolean;
  /** Left‑panel width in px. Default 280 */
  leftPanelWidth?: number;
  /** Right‑panel width in px (when open). Default 340 */
  rightPanelWidth?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BrainCanvas({
  activeDrugs,
  selectedRegion,
  selectedDeficit,
  onRegionClick,
  onRegionHover,
  opacity = 0.15,
  rightPanelOpen = false,
  leftPanelWidth = 280,
  rightPanelWidth = 340,
}: BrainCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mutable refs so the animation loop always sees the latest props without
  // tearing down and recreating the entire Three.js scene.
  const propsRef = useRef({
    activeDrugs,
    selectedRegion,
    selectedDeficit,
    onRegionClick,
    onRegionHover,
    opacity,
    rightPanelOpen,
    leftPanelWidth,
    rightPanelWidth,
  });

  // Keep propsRef in sync on every render
  propsRef.current = {
    activeDrugs,
    selectedRegion,
    selectedDeficit,
    onRegionClick,
    onRegionHover,
    opacity,
    rightPanelOpen,
    leftPanelWidth,
    rightPanelWidth,
  };

  // -----------------------------------------------------------------------
  // Refs for Three.js objects that must persist across renders
  // -----------------------------------------------------------------------
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const markerGroupRef = useRef<THREE.Group | null>(null);
  const markersRef = useRef<Record<string, THREE.Mesh>>({});
  const tractLinesRef = useRef<THREE.Line[]>([]);
  const particlesRef = useRef<THREE.Points | null>(null);
  const brainMeshRef = useRef<THREE.Object3D | null>(null);
  const brainMaterialsRef = useRef<THREE.MeshPhysicalMaterial[]>([]);
  const rafRef = useRef<number>(0);

  // -----------------------------------------------------------------------
  // Stable callbacks for DOM events (avoids re‑binding every render)
  // -----------------------------------------------------------------------
  const handleClick = useCallback((ev: MouseEvent) => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const mg = markerGroupRef.current;
    if (!renderer || !camera || !mg) return;

    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((ev.clientX - rect.left) / rect.width) * 2 - 1,
      -((ev.clientY - rect.top) / rect.height) * 2 + 1,
    );
    const rc = new THREE.Raycaster();
    rc.setFromCamera(mouse, camera);
    const hits = rc.intersectObjects(mg.children);

    if (hits.length > 0 && hits[0].object.userData.rid) {
      const id = hits[0].object.userData.rid as string;
      // Compute screen‑space position of the marker for popup placement
      const vec = new THREE.Vector3();
      hits[0].object.getWorldPosition(vec);
      vec.project(camera);
      const cx = (vec.x * 0.5 + 0.5) * rect.width + rect.left;
      const cy = (-vec.y * 0.5 + 0.5) * rect.height + rect.top;

      if (propsRef.current.selectedRegion === id) {
        propsRef.current.onRegionClick(null);
      } else {
        propsRef.current.onRegionClick(id, { x: cx, y: cy });
      }
    } else {
      propsRef.current.onRegionClick(null);
    }
  }, []);

  const handleMouseMove = useCallback((ev: MouseEvent) => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const mg = markerGroupRef.current;
    if (!renderer || !camera || !mg) return;

    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((ev.clientX - rect.left) / rect.width) * 2 - 1,
      -((ev.clientY - rect.top) / rect.height) * 2 + 1,
    );
    const rc = new THREE.Raycaster();
    rc.setFromCamera(mouse, camera);
    const hits = rc.intersectObjects(mg.children);

    if (hits.length > 0 && hits[0].object.userData.rid) {
      const id = hits[0].object.userData.rid as string;
      renderer.domElement.style.cursor = 'pointer';
      propsRef.current.onRegionHover(id, ev);
    } else {
      renderer.domElement.style.cursor = 'grab';
      propsRef.current.onRegionHover(null);
    }
  }, []);

  // -----------------------------------------------------------------------
  // Main setup effect — runs once on mount, cleans up on unmount
  // -----------------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // === Scene ===
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // === Camera ===
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.5, 3.5);
    cameraRef.current = camera;

    // === Renderer ===
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // === Post‑processing ===
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.5,  // strength
      0.8,  // radius
      0.75, // threshold
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());
    composerRef.current = composer;

    // === Controls ===
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.5;
    controls.maxDistance = 8;
    controlsRef.current = controls;

    // === Lighting ===
    scene.add(new THREE.AmbientLight(0x334455, 0.4));

    const dirLight = new THREE.DirectionalLight(0x6e8caa, 0.8);
    dirLight.position.set(0, 2, 3);
    scene.add(dirLight);

    const warmLight = new THREE.PointLight(0xff6633, 0.3, 5);
    warmLight.position.set(0, -1, 1);
    scene.add(warmLight);

    const rimLight = new THREE.PointLight(0x8844ff, 0.4, 6);
    rimLight.position.set(0, 0.5, -2);
    scene.add(rimLight);

    // === Marker group ===
    const mg = new THREE.Group();
    scene.add(mg);
    markerGroupRef.current = mg;

    // === Clock ===
    const clock = new THREE.Clock();
    clockRef.current = clock;

    // ------------------------------------------------------------------
    // Helper: build zone markers + tracts (called after brain loads)
    // ------------------------------------------------------------------
    function initScene() {
      const markers: Record<string, THREE.Mesh> = {};
      (Object.entries(RG) as [string, BrainRegion][]).forEach(([id, r]) => {
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.035, 16, 16),
          new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(r.c),
            emissive: new THREE.Color(r.c),
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.95,
            roughness: 0.2,
          }),
        );
        sphere.position.set(r.p[0], r.p[1], r.p[2]);
        sphere.userData = { rid: id };
        mg.add(sphere);
        markers[id] = sphere;

        // Ring billboard
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.045, 0.065, 32),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(r.c),
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide,
          }),
        );
        ring.position.copy(sphere.position);
        ring.userData = { rid: id, isR: true };
        mg.add(ring);
      });
      markersRef.current = markers;

      // Tracts (bezier curves)
      const lines: THREE.Line[] = [];
      (TR as Tract[]).forEach((t) => {
        const a = RG[t.f] as BrainRegion | undefined;
        const b = RG[t.t] as BrainRegion | undefined;
        if (!a || !b) return;
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(a.p[0], a.p[1], a.p[2]),
          new THREE.Vector3(
            (a.p[0] + b.p[0]) / 2,
            (a.p[1] + b.p[1]) / 2 + 0.12,
            (a.p[2] + b.p[2]) / 2,
          ),
          new THREE.Vector3(b.p[0], b.p[1], b.p[2]),
        );
        const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(40));
        const mat = new THREE.LineBasicMaterial({
          color: new THREE.Color(NTC[t.nt] || '#666'),
          transparent: true,
          opacity: 0,
        });
        const line = new THREE.Line(geo, mat);
        line.userData = { tr: t };
        scene.add(line);
        lines.push(line);
      });
      tractLinesRef.current = lines;
    }

    // ------------------------------------------------------------------
    // Helper: create particle cloud from a geometry
    // ------------------------------------------------------------------
    function createParticles(positions: THREE.BufferAttribute, parent: THREE.Object3D) {
      const particleCount = Math.min(positions.count, 5000);
      const step = Math.max(1, Math.floor(positions.count / particleCount));
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(particleCount * 3);
      for (let i = 0, j = 0; i < positions.count && j < particleCount; i += step, j++) {
        pos[j * 3] = positions.getX(i);
        pos[j * 3 + 1] = positions.getY(i);
        pos[j * 3 + 2] = positions.getZ(i);
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color: 0xaabbcc,
        size: 0.008,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
      });
      const pts = new THREE.Points(geo, mat);
      pts.position.copy(parent.position);
      pts.rotation.copy(parent.rotation);
      pts.scale.copy(parent.scale);
      scene.add(pts);
      particlesRef.current = pts;
    }

    // ------------------------------------------------------------------
    // Helper: create procedural fallback brain
    // ------------------------------------------------------------------
    function createFallbackBrain() {
      const geo = new THREE.SphereGeometry(1, 64, 48);
      const p = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        let x = p.getX(i) * 0.75;
        let y = p.getY(i);
        const z = p.getZ(i) * 0.9;
        if (y < -0.3) y *= 0.5;
        const n = Math.sin(x * 8) * Math.cos(z * 6) * 0.03;
        const r = Math.sqrt(x * x + y * y + z * z);
        p.setXYZ(i, x + (x / r) * n, y + (y / r) * n, z + (z / r) * n);
      }
      geo.computeVertexNormals();

      const brainMat = new THREE.MeshPhysicalMaterial({
        color: 0x8899aa,
        transparent: true,
        opacity: propsRef.current.opacity,
        roughness: 0.6,
        metalness: 0.15,
        clearcoat: 0.3,
        clearcoatRoughness: 0.4,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const brain = new THREE.Mesh(geo, brainMat);
      brainMeshRef.current = brain;
      brainMaterialsRef.current = [brainMat];

      // Wireframe clone
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x6ee7b7,
        wireframe: true,
        transparent: true,
        opacity: 0.06,
        depthWrite: false,
      });
      const wireClone = new THREE.Mesh(geo, wireMat);
      wireClone.scale.multiplyScalar(1.002);
      scene.add(wireClone);
      scene.add(brain);

      createParticles(p, brain);
      initScene();
    }

    // ------------------------------------------------------------------
    // Load brain.glb (with fallback)
    // ------------------------------------------------------------------
    const loader = new GLTFLoader();
    loader.load(
      '/brain.glb',
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const sc = 2 / Math.max(size.x, size.y, size.z);
        model.position.sub(center);
        model.scale.setScalar(sc);
        model.position.y += 0.1;

        let largestMesh: THREE.Mesh | null = null;
        const mats: THREE.MeshPhysicalMaterial[] = [];

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const mat = new THREE.MeshPhysicalMaterial({
              color: 0x8899aa,
              transparent: true,
              opacity: propsRef.current.opacity,
              roughness: 0.6,
              metalness: 0.15,
              clearcoat: 0.3,
              clearcoatRoughness: 0.4,
              side: THREE.DoubleSide,
              depthWrite: false,
            });
            mesh.material = mat;
            mats.push(mat);

            if (
              !largestMesh ||
              (mesh.geometry.attributes.position?.count ?? 0) >
                (largestMesh.geometry.attributes.position?.count ?? 0)
            ) {
              largestMesh = mesh;
            }

            // Wireframe clone
            const wireMat = new THREE.MeshBasicMaterial({
              color: 0x6ee7b7,
              wireframe: true,
              transparent: true,
              opacity: 0.06,
              depthWrite: false,
            });
            const wireClone = mesh.clone();
            wireClone.material = wireMat;
            wireClone.scale.multiplyScalar(1.002);
            model.add(wireClone);
          }
        });

        scene.add(model);
        brainMeshRef.current = model;
        brainMaterialsRef.current = mats;

        if (largestMesh) {
          const positions = (largestMesh as THREE.Mesh).geometry.attributes
            .position as THREE.BufferAttribute;
          createParticles(positions, model);
        }

        initScene();
      },
      undefined,
      () => {
        // GLB failed — use procedural fallback
        createFallbackBrain();
      },
    );

    // ------------------------------------------------------------------
    // Resize handler
    // ------------------------------------------------------------------
    function handleResize() {
      if (!container || !renderer || !camera || !composer) return;
      const { rightPanelOpen: rpo, leftPanelWidth: lpw, rightPanelWidth: rpw } = propsRef.current;
      const rpOffset = rpo ? rpw : 0;
      const w = window.innerWidth - lpw - rpOffset;
      const h = window.innerHeight - 48; // top bar
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    // ------------------------------------------------------------------
    // Mouse events
    // ------------------------------------------------------------------
    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    // ------------------------------------------------------------------
    // Animation loop
    // ------------------------------------------------------------------
    function animate() {
      rafRef.current = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      controls.update();

      const { selectedRegion: sr, selectedDeficit: sd } = propsRef.current;

      // --- Marker pulsing ---
      Object.entries(markersRef.current).forEach(([_id, m]) => {
        if ((m.material as THREE.MeshPhysicalMaterial).emissiveIntensity > 0.3) {
          (m.material as THREE.MeshPhysicalMaterial).emissiveIntensity +=
            Math.sin(t * 3) * 0.015;
        }
      });

      // --- Deficit zone critical pulsing ---
      if (sd) {
        // We don't have the DEFICITS array here; the parent can highlight
        // zones via selectedDeficit. For now pulse selected‑deficit zones
        // based on external highlighting done via props in updateVisuals().
      }

      // --- Ring billboards ---
      mg.children.forEach((child) => {
        if (child.userData.isR) {
          child.lookAt(camera.position);
          if ((child as THREE.Mesh).material) {
            ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity =
              0.2 + Math.sin(t * 2) * 0.08;
          }
        }
      });

      // --- Tract opacity animation ---
      tractLinesRef.current.forEach((line) => {
        if ((line.material as THREE.LineBasicMaterial).opacity > 0) {
          (line.material as THREE.LineBasicMaterial).opacity =
            0.2 + Math.sin(t * 2) * 0.15;
        }
      });

      // --- Particle rotation + opacity shimmer ---
      if (particlesRef.current) {
        particlesRef.current.rotation.y += 0.0003;
        (particlesRef.current.material as THREE.PointsMaterial).opacity =
          0.3 + Math.sin(Date.now() * 0.001) * 0.1;
      }

      // --- Brain opacity from slider ---
      brainMaterialsRef.current.forEach((mat) => {
        mat.opacity = propsRef.current.opacity;
      });

      composer.render();
    }
    animate();

    // ------------------------------------------------------------------
    // Cleanup
    // ------------------------------------------------------------------
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      controls.dispose();
      renderer.dispose();
      composer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Mount once — props are read via propsRef

  // -----------------------------------------------------------------------
  // Effect: re‑run resize when panel state changes
  // -----------------------------------------------------------------------
  useEffect(() => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const composer = composerRef.current;
    const container = containerRef.current;
    if (!renderer || !camera || !composer || !container) return;

    const { rightPanelOpen: rpo, leftPanelWidth: lpw, rightPanelWidth: rpw } = propsRef.current;
    const rpOffset = rpo ? rpw : 0;
    const w = window.innerWidth - lpw - rpOffset;
    const h = window.innerHeight - 48;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
  }, [rightPanelOpen, leftPanelWidth, rightPanelWidth]);

  // -----------------------------------------------------------------------
  // Effect: update marker visuals when activeDrugs / selectedRegion change
  // -----------------------------------------------------------------------
  useEffect(() => {
    const markers = markersRef.current;
    if (!Object.keys(markers).length) return;

    Object.entries(markers).forEach(([id, m]) => {
      const mat = m.material as THREE.MeshPhysicalMaterial;
      const region = RG[id] as BrainRegion;
      const isSelected = selectedRegion === id;

      // Check if any active drug targets this zone
      let totalIntensity = 0;
      Object.keys(activeDrugs).forEach((drugId) => {
        // Basic activation: drug is active -> marker lights up.
        // Detailed occupancy logic lives in the parent.
        if (activeDrugs[drugId] > 0) {
          totalIntensity += 1;
        }
      });

      if (totalIntensity > 0) {
        m.scale.setScalar(1 + totalIntensity * 0.06);
        mat.emissiveIntensity = isSelected ? 2 : 0.5 + totalIntensity * 0.1;
        mat.opacity = isSelected ? 1 : 0.85;
      } else {
        m.scale.setScalar(0.5);
        mat.emissive.set(region.c);
        mat.emissiveIntensity = 0.1;
        mat.opacity = 0.3;
      }

      // Deficit highlighting — dim non‑deficit zones
      if (selectedDeficit) {
        if (!isSelected) {
          mat.opacity *= 0.4;
          mat.emissiveIntensity *= 0.3;
        }
      }
    });

    // Tract activation
    const DA_DRUGS = [
      'bupropion', 'pramipexole', 'cariprazine', 'aripiprazole', 'brexpiprazole',
      'methylphenidate', 'lisdexamfetamine', 'modafinil', 'selegiline_oral',
      'amisulpride_low', 'levodopa', 'auvelity',
    ];
    const NA_DRUGS = [
      'atomoxetine', 'bupropion', 'duloxetine', 'guanfacine', 'desipramine',
      'nortriptyline', 'protriptyline', 'reboxetine', 'milnacipran',
      'levomilnacipran', 'venlafaxine', 'desvenlafaxine', 'quetiapine',
      'lisdexamfetamine', 'brexpiprazole',
    ];
    const SERT_DRUGS = [
      'sertraline', 'vortioxetine', 'duloxetine', 'escitalopram', 'fluvoxamine',
      'fluoxetine', 'venlafaxine', 'desvenlafaxine', 'milnacipran',
      'levomilnacipran', 'amitriptyline', 'dextromethorphan',
    ];

    const activeIds = Object.keys(activeDrugs);

    tractLinesRef.current.forEach((line) => {
      const t = line.userData.tr as { f: string; t: string; nt: string };
      let active = false;
      if (t.nt === 'DA') active = activeIds.some((d) => DA_DRUGS.includes(d));
      if (t.nt === 'NA') active = activeIds.some((d) => NA_DRUGS.includes(d));
      if (t.nt === '5-HT') active = activeIds.some((d) => SERT_DRUGS.includes(d));
      (line.material as THREE.LineBasicMaterial).opacity = active ? 0.4 : 0;
    });
  }, [activeDrugs, selectedRegion, selectedDeficit]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    />
  );
}

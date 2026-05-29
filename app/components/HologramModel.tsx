"use client";

import { Component, ReactNode, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Grid, OrbitControls, useGLTF } from "@react-three/drei";
import { DoubleSide, EdgesGeometry, LineBasicMaterial, LineSegments, MeshStandardMaterial, Box3, Vector3, PerspectiveCamera } from "three";
import type { Group } from "three";

// Configurables de framing (ajustables)
const MODEL_VERTICAL_OFFSET = 0; // offset vertical para centrar visualmente el modelo
const MODEL_VIEW_SCALE = 0.72; // factor de escala para el framing final

interface HologramModelProps {
  modelPath: string;
  modelLabel?: string;
}

function HologramScene({ modelPath, controlsRef }: { modelPath: string; controlsRef?: React.MutableRefObject<any> | null }) {
  const sceneRef = useRef<Group>(null);
  const modelRef = useRef<Group>(null);
  const gltf = useGLTF(modelPath, true) as any;
  const { camera } = useThree();

  useEffect(() => {
    if (!gltf?.scene) {
      return;
    }

    // Aplicar estilo holográfico a todos los meshes del GLB y añadir líneas exteriores
    gltf.scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        child.material = new MeshStandardMaterial({
          color: "#5A0B0B",
          transparent: true,
          opacity: 0.32,
          emissive: "#2A0000",
          emissiveIntensity: 0.25,
          roughness: 1,
          metalness: 0,
          toneMapped: false,
          side: DoubleSide,
        });

        const existingEdges = child.getObjectByName("hologram-edge-lines");
        if (!existingEdges && child.geometry) {
          const edgeGeometry = new EdgesGeometry(child.geometry, 15);
          const edgeMaterial = new LineBasicMaterial({ color: "#FF6B6B" });
          const edgeLines = new LineSegments(edgeGeometry, edgeMaterial);
          edgeLines.name = "hologram-edge-lines";
          edgeLines.renderOrder = 1;
          edgeLines.frustumCulled = false;
          child.add(edgeLines);
        }
      }
    });

    // Manual centering + scaling con Box3: asegura que el modelo quepa y esté centrado
    try {
      const box = new Box3().setFromObject(gltf.scene);
      const size = box.getSize(new Vector3());
      const center = box.getCenter(new Vector3());

      // Recentrar la geometría en su propio origen
      gltf.scene.position.sub(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const autoScale = maxDim > 0 ? 1 / maxDim : 1;
      let finalScale = autoScale * MODEL_VIEW_SCALE;
      finalScale = Math.min(Math.max(finalScale, 0.02), 100);

      if (modelRef.current) {
        modelRef.current.scale.setScalar(finalScale);
        modelRef.current.position.set(0, MODEL_VERTICAL_OFFSET, 0);
      }

      // El model se centra y escala con Box3. La cámara se mantiene con valores seguros del Canvas.
      if (controlsRef && controlsRef.current) {
        controlsRef.current.target.set(0, MODEL_VERTICAL_OFFSET, 0);
        controlsRef.current.update();
      }
    } catch (e) {
      // No crítico; fallback visual con Bounds/Grid
      // console.warn('Box3 centering failed', e);
    }
  }, [gltf]);

  useFrame((_, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += delta * 0.08; // rotación lenta
    }
  });

  const showHelpers = false; // activar temporalmente para debug

  return (
    <group ref={sceneRef} position={[0, 0, 0]} scale={[1, 1, 1]}>
      <group ref={modelRef} position={[0, 0, 0]}>
        {/* El scene ya fue recentered arriba; renderizar dentro del grupo escalado */}
        <primitive object={gltf.scene} />
      </group>

      <ContactShadows
        position={[0, -1.1, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
        far={2.2}
      />

      <Grid
        position={[0, -1.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        args={[12, 12]}
        sectionColor="rgba(255, 77, 77, 0.15)"
        cellColor="rgba(255, 77, 77, 0.08)"
        fadeDistance={8}
        fadeStrength={3}
        sectionThickness={1}
        cellThickness={0.2}
      />

      {showHelpers && <axesHelper args={[2]} />}
      {showHelpers && <gridHelper args={[10, 10]} />}
    </group>
  );
}

class HologramErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Mantener el error en consola y mostrar feedback visual minimalista.
    console.error("HologramModel render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="hologram-fallback">
          <div>[ MODEL_RENDER_ERROR ]</div>
          <div>Hubo un problema al renderizar el modelo 3D.</div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function HologramModel({ modelPath, modelLabel = "HOLOGRAM" }: HologramModelProps) {
  const [status, setStatus] = useState<"checking" | "ready" | "missing" | "error">("checking");
  const normalizedPath = useMemo(() => modelPath.replace(/\\\\/g, "/"), [modelPath]);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    let active = true;
    setStatus("checking");

    fetch(normalizedPath, { method: "HEAD" })
      .then((response) => {
        if (!active) {
          return;
        }

        if (response.ok) {
          setStatus("ready");
        } else {
          setStatus("missing");
        }
      })
      .catch(() => {
        if (active) {
          setStatus("error");
        }
      });

    return () => {
      active = false;
    };
  }, [normalizedPath]);

  return (
    <div className="hologram-viewer-wrapper">
      <div className="hologram-overlay" aria-hidden="true">
        <div className="hologram-scanlines" />
      </div>

      {status === "ready" ? (
        <Canvas
          className="hologram-canvas"
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [4.5, 3.5, 5.5], fov: 30, near: 0.1, far: 100000 }}
        >
          <color attach="background" args={["#000"]} />

          <ambientLight intensity={1} />
          <directionalLight position={[2.5, 4, 3]} intensity={1.05} color="#ff4d4d" />
          <directionalLight position={[-3, 1, -2]} intensity={0.35} color="#980000" />

          <HologramErrorBoundary>
            <Suspense fallback={null}>
              <HologramScene modelPath={normalizedPath} controlsRef={controlsRef} />
            </Suspense>
          </HologramErrorBoundary>

          <OrbitControls
            ref={controlsRef}
            target={[0, 0, 0]}
            enablePan={false}
            enableZoom={false}
            autoRotate
            autoRotateSpeed={0.35}
            minDistance={2.6}
            maxDistance={30}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2}
            rotateSpeed={0.4}
            zoomSpeed={0.3}
          />
        </Canvas>
      ) : (
        <div className="hologram-fallback">
          <div>[ {status === "checking" ? "LOADING_MODEL" : status === "missing" ? "MODEL_NOT_FOUND" : "LOAD_ERROR"} ]</div>
          <div>{status === "missing" ? `Ruta: ${normalizedPath}` : status === "error" ? "Fallo al cargar el archivo 3D." : "Verificando disponibilidad..."}</div>
        </div>
      )}

      {status === "ready" && <div className="hologram-helper">MODEL_RENDERING_ACTIVE</div>}

      <div className="hologram-footer">
        <div>{modelLabel.toUpperCase()}</div>
      </div>
    </div>
  );
}

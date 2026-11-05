"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei"
import { Suspense } from "react"
import * as THREE from "three"
import SceneSetup from "./scene-setup"
import ModelComponent from "./model-component"
import ProceduralModelComponent from "./procedural-model-component"
import LoadingPlaceholder from "./loading-placeholder"

interface ModelViewerProps {
  modelUrl?: string | null
  threeObject?: THREE.Object3D | null
}

export default function ModelViewer({ modelUrl, threeObject }: ModelViewerProps) {
  const hasModel = Boolean(modelUrl || threeObject)

  return (
    <div className="w-full h-[100dvh] bg-black bg-radial-gradient">
      <Canvas camera={{ position: [0, 1.5, 5], fov: 50 }} shadows>
        <SceneSetup />
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[6, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-6, 4, -5]} intensity={0.5} />
        <pointLight position={[0, -3, 2]} intensity={0.3} />

        <Suspense fallback={<LoadingPlaceholder />}>
          {threeObject ? (
            <ProceduralModelComponent object={threeObject} />
          ) : modelUrl ? (
            <ModelComponent url={modelUrl} />
          ) : (
            <LoadingPlaceholder />
          )}
        </Suspense>

        <ContactShadows
          position={[0, -0.01, 0]}
          opacity={0.6}
          scale={10}
          blur={1.5}
          far={4}
        />

        <OrbitControls
          minDistance={1.5}
          maxDistance={12}
          enableZoom={true}
          enablePan={true}
          autoRotate={hasModel}
          autoRotateSpeed={0.8}
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  )
}

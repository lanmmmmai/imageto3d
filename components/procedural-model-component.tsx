"use client"

import { useEffect, useRef } from "react"
import { useThree } from "@react-three/fiber"
import { Center } from "@react-three/drei"
import * as THREE from "three"

interface ProceduralModelComponentProps {
  object: THREE.Object3D
}

export default function ProceduralModelComponent({ object }: ProceduralModelComponentProps) {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    // Reset camera position to frame the new model nicely
    camera.position.set(0, 1.5, 5)
    camera.lookAt(0, 0, 0)

    // Compute bounding box and normalize scale if too large/small
    if (object) {
      const box = new THREE.Box3().setFromObject(object)
      const size = new THREE.Vector3()
      box.getSize(size)
      const maxDim = Math.max(size.x, size.y, size.z)

      if (maxDim > 0 && (maxDim > 5 || maxDim < 1.5)) {
        const targetSize = 3.0
        const scaleFactor = targetSize / maxDim
        object.scale.set(scaleFactor, scaleFactor, scaleFactor)
      }
    }
  }, [object, camera])

  return (
    <Center top>
      <group ref={groupRef}>
        <primitive object={object} />
      </group>
    </Center>
  )
}

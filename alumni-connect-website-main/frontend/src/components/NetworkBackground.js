import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Particles = () => {
  const pointsRef = useRef();

  // Create points in a sphere
  const [positions, colors] = useMemo(() => {
    const count = 2500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    
    // Theme colors matching Alumnex Connect
    const color1 = new THREE.Color('#4f46e5'); // Primary 600 (indigo)
    const color2 = new THREE.Color('#0d9488'); // Alumni 600 (teal)
    const color3 = new THREE.Color('#ffffff'); // White for highlights

    for (let i = 0; i < count; i++) {
      // Random position inside a hollow sphere/torus-like volume
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 2.0 + Math.random() * 2.5; // Radius

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color distribution
      const randColor = Math.random();
      let mixedColor;
      if (randColor < 0.4) mixedColor = color1;
      else if (randColor < 0.8) mixedColor = color2;
      else mixedColor = color3;
      
      // Add slight variation
      color.copy(mixedColor).offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return [positions, colors];
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (pointsRef.current) {
      // Slow rotation
      pointsRef.current.rotation.y = time * 0.03;
      pointsRef.current.rotation.x = time * 0.015;
      
      // Slight floating effect on mouse move
      // Note: mouse coords are normalized (-1 to 1)
      const targetX = state.pointer.x * 0.5;
      const targetY = state.pointer.y * 0.5;
      
      pointsRef.current.position.x += (targetX - pointsRef.current.position.x) * 0.02;
      pointsRef.current.position.y += (targetY - pointsRef.current.position.y) * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        vertexColors={true}
        transparent={true}
        opacity={0.7}
        sizeAttenuation={true}
      />
    </points>
  );
};

const NetworkBackground = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 60 }}>
        {/* Subtle ambient light if we were using meshes, but Points use basic materials */}
        {/* The fog helps blend the particles into the background */}
        {/* The fog color is transparent black, which works for both light and dark modes but we can just use opacity */}
        <Particles />
      </Canvas>
    </div>
  );
};

export default NetworkBackground;

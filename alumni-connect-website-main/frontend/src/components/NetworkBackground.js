import React, { useRef, useMemo, useState, useEffect, Component } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn('NetworkBackground WebGL Canvas error (falling back to CSS):', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const isWebGLAvailable = () => {
  if (typeof window === 'undefined') return false;
  try {
    if (!window.WebGLRenderingContext) return false;
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!(gl && gl instanceof WebGLRenderingContext);
  } catch (e) {
    return false;
  }
};

const FallbackBackground = () => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
    <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
    <div className="absolute top-2/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
  </div>
);

const Particles = () => {
  const pointsRef = useRef();

  // Create points in a sphere
  const [positions, colors] = useMemo(() => {
    const count = 1800; // Optimized count for performance across mobile & desktop
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    // Theme colors matching Alumnex Connect
    const color1 = new THREE.Color('#4f46e5'); // Primary 600 (indigo)
    const color2 = new THREE.Color('#0d9488'); // Alumni 600 (teal)
    const color3 = new THREE.Color('#ffffff'); // White for highlights
    const color = new THREE.Color();

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
      
      // Slight floating effect on pointer move
      const targetX = (state.pointer?.x || 0) * 0.5;
      const targetY = (state.pointer?.y || 0) * 0.5;
      
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
  const [webGLSupported, setWebGLSupported] = useState(false);

  useEffect(() => {
    setWebGLSupported(isWebGLAvailable());
  }, []);

  if (!webGLSupported) {
    return <FallbackBackground />;
  }

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <CanvasErrorBoundary fallback={<FallbackBackground />}>
        <Canvas 
          camera={{ position: [0, 0, 4.5], fov: 60 }}
          gl={{ powerPreference: 'low-power', antialias: false, failIfMajorPerformanceCaveat: false }}
        >
          <Particles />
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
};

export default NetworkBackground;

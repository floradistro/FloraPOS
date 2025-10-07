'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface RetroButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

export function RetroButton({ onClick, disabled, isLoading, children }: RetroButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-2, 2, 1, -1, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: false, // Pixelated look
      alpha: true 
    });
    renderer.setSize(400, 80);
    renderer.setPixelRatio(1); // Keep it pixelated

    // Create retro button shape
    const geometry = new THREE.BoxGeometry(3.8, 0.8, 0.3);
    
    // Retro gradient material
    const material = new THREE.MeshBasicMaterial({
      color: disabled ? 0x4a0e0e : 0xff3333,
      wireframe: false,
    });

    const buttonMesh = new THREE.Mesh(geometry, material);
    scene.add(buttonMesh);

    // Add edges for retro look
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: disabled ? 0x661111 : 0xff6666,
      linewidth: 2 
    });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    buttonMesh.add(wireframe);

    // Add glow particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 50;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 4;
      posArray[i + 1] = (Math.random() - 0.5) * 1.2;
      posArray[i + 2] = (Math.random() - 0.5) * 0.5;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      color: disabled ? 0x661111 : 0xff3333,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Animation
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Pulsing effect
      const scale = isPressed ? 0.95 : (isHovered ? 1.05 : 1.0);
      buttonMesh.scale.set(scale, scale, scale);

      // Rotate button slightly for 3D effect
      buttonMesh.rotation.x = Math.sin(elapsedTime * 0.5) * 0.05;
      buttonMesh.rotation.y = Math.cos(elapsedTime * 0.3) * 0.05;

      // Animate particles
      particlesMesh.rotation.z = elapsedTime * 0.2;
      
      const positions = particlesGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;
        positions[i3 + 1] = Math.sin(elapsedTime + i) * 0.1;
      }
      particlesGeometry.attributes.position.needsUpdate = true;

      // Update colors based on state
      if (!disabled) {
        const glowIntensity = isHovered ? 1.2 : 1.0;
        const color = new THREE.Color(0xff3333).multiplyScalar(glowIntensity);
        material.color = color;
        lineMaterial.color = new THREE.Color(0xff6666).multiplyScalar(glowIntensity);
        particlesMaterial.color = color;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      edges.dispose();
      lineMaterial.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
    };
  }, [isHovered, isPressed, disabled]);

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className="relative w-full overflow-hidden rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: 'transparent',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      <canvas
        ref={canvasRef}
        width={400}
        height={80}
        style={{
          width: '100%',
          height: '40px',
          display: 'block',
          imageRendering: 'pixelated',
          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 20px rgba(255, 51, 51, 0.6))',
        }}
      />
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          textShadow: '2px 2px 0px rgba(0, 0, 0, 0.8), 0 0 10px rgba(255, 51, 51, 0.8), 0 0 20px rgba(255, 51, 51, 0.5)',
          fontFamily: 'monospace',
          fontSize: '14px',
          fontWeight: 'bold',
          letterSpacing: '2px',
          color: disabled ? '#661111' : '#ffffff'
        }}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            LOADING...
          </div>
        ) : (
          children
        )}
      </div>
    </button>
  );
}


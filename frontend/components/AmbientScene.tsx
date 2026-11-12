"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export type AmbientSceneProps = {
  enabled: boolean;
  quality: "low" | "high";
  isThinking: boolean;
  hasMessages: boolean;
};

type Ripple = {
  mesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  age: number;
};

function createSoftSpriteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create KAEL glow texture.");
  }

  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,0.72)");
  gradient.addColorStop(0.2, "rgba(193,18,31,0.38)");
  gradient.addColorStop(1, "rgba(193,18,31,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

export default function AmbientScene({
  enabled,
  quality,
  isThinking,
  hasMessages,
}: AmbientSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ isThinking, hasMessages });

  useEffect(() => {
    stateRef.current = { isThinking, hasMessages };
  }, [isThinking, hasMessages]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !enabled) {
      return undefined;
    }

    let animationFrame = 0;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 7.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: quality === "high",
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === "high" ? 1.5 : 1));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    const whiteMaterial = new THREE.MeshBasicMaterial({
      color: 0xe4e4e7,
      wireframe: true,
      transparent: true,
      opacity: 0.76,
    });
    const redMaterial = new THREE.MeshBasicMaterial({
      color: 0xc1121f,
      wireframe: true,
      transparent: true,
      opacity: 0.96,
    });
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xc1121f,
      transparent: true,
      opacity: 0.94,
    });

    const whiteShell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 1), whiteMaterial);
    const redShell = new THREE.Mesh(new THREE.TetrahedronGeometry(1.05, 1), redMaterial);
    redShell.rotation.set(0.4, 0.6, 0.2);
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 1), coreMaterial);
    root.add(whiteShell, redShell, core);

    const glowTexture = createSoftSpriteTexture();
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xc1121f,
      transparent: true,
      depthWrite: false,
      opacity: 0.52,
    });
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.setScalar(4.2);
    root.add(glow);

    const ringMaterials = [
      new THREE.MeshBasicMaterial({ color: 0xe4e4e7, transparent: true, opacity: 0.3 }),
      new THREE.MeshBasicMaterial({ color: 0xc1121f, transparent: true, opacity: 0.48 }),
      new THREE.MeshBasicMaterial({ color: 0x991b1b, transparent: true, opacity: 0.3 }),
    ];
    const rings = [
      new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.006, 4, 96), ringMaterials[0]),
      new THREE.Mesh(new THREE.TorusGeometry(1.82, 0.008, 4, 96), ringMaterials[1]),
      new THREE.Mesh(new THREE.TorusGeometry(2.18, 0.004, 4, 96), ringMaterials[2]),
    ];
    rings[0].rotation.set(0.8, 0.1, 0.1);
    rings[1].rotation.set(1.3, 0.5, -0.4);
    rings[2].rotation.set(0.4, -0.7, 0.8);
    rings.forEach((ring) => root.add(ring));

    const particleCount = quality === "high" ? 420 : 180;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.35 + Math.random() * 1.65;
      particlePositions[index * 3] = Math.cos(angle) * radius;
      particlePositions[index * 3 + 1] = (Math.random() - 0.5) * 0.08;
      particlePositions[index * 3 + 2] = Math.sin(angle) * radius;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xc1121f,
      size: quality === "high" ? 0.045 : 0.055,
      transparent: true,
      opacity: 0.92,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.rotation.x = 0.7;
    root.add(particles);

    const gridSize = quality === "high" ? 18 : 12;
    const gridGeometry = new THREE.PlaneGeometry(12, 8, gridSize, Math.floor(gridSize * 0.66));
    const gridMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      wireframe: true,
      uniforms: {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      },
      vertexShader: `
        uniform float uTime;
        uniform vec2 uPointer;
        varying float vDistance;
        void main() {
          vec3 transformed = position;
          vec2 normalizedPosition = position.xy / vec2(6.0, 4.0) * 0.5 + 0.5;
          float distanceToPointer = distance(normalizedPosition, uPointer);
          float pointerWave = exp(-distanceToPointer * 16.0) * 0.24;
          transformed.z += sin(position.x * 1.2 + uTime * 0.5) * 0.05;
          transformed.z += cos(position.y * 1.4 + uTime * 0.35) * 0.04;
          transformed.z += pointerWave;
          vDistance = distanceToPointer;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `,
      fragmentShader: `
        varying float vDistance;
        void main() {
          float alpha = (1.0 - smoothstep(0.0, 0.75, vDistance)) * 0.18 + 0.05;
          gl_FragColor = vec4(0.75, 0.12, 0.16, alpha);
        }
      `,
    });
    const grid = new THREE.Mesh(gridGeometry, gridMaterial);
    grid.position.set(0, -2.5, -2.4);
    grid.rotation.x = -0.32;
    scene.add(grid);

    const ripples: Ripple[] = [];
    const pointer = new THREE.Vector2(0.5, 0.5);
    const clock = new THREE.Clock();

    const resize = () => {
      const width = mount.clientWidth || window.innerWidth;
      const height = mount.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointer.set(event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight);
      gridMaterial.uniforms.uPointer.value.copy(pointer);
    };

    const handleClick = (event: MouseEvent) => {
      const x = ((event.clientX / window.innerWidth) * 2 - 1) * 3.5;
      const y = (-(event.clientY / window.innerHeight) * 2 + 1) * 2.1;
      const ripple = new THREE.Mesh(
        new THREE.RingGeometry(0.04, 0.055, 48),
        new THREE.MeshBasicMaterial({
          color: 0xc1121f,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
        }),
      );
      ripple.position.set(x, y, -0.4);
      scene.add(ripple);
      ripples.push({ mesh: ripple, age: 0 });
      if (ripples.length > 4) {
        const oldest = ripples.shift();
        oldest?.mesh.geometry.dispose();
        oldest?.mesh.material.dispose();
        if (oldest) scene.remove(oldest.mesh);
      }
    };

    const render = () => {
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      const currentState = stateRef.current;
      const speed = currentState.isThinking ? 2.6 : 0.72;
      const targetX = currentState.hasMessages ? 2.05 : 2.35;
      const targetZ = currentState.hasMessages ? -0.9 : -0.35;
      root.position.x += (targetX - root.position.x) * 0.035;
      root.position.z += (targetZ - root.position.z) * 0.035;
      root.scale.setScalar(currentState.hasMessages ? 0.82 : 1);
      root.rotation.y += delta * speed;
      whiteShell.rotation.x += delta * speed * 0.46;
      redShell.rotation.y -= delta * speed * 0.72;
      core.rotation.z += delta * speed;
      const pulse = 1 + Math.sin(elapsed * (currentState.isThinking ? 6 : 2.2)) * (currentState.isThinking ? 0.12 : 0.04);
      core.scale.setScalar(pulse);
      glowMaterial.opacity = (currentState.hasMessages ? 0.32 : 0.72) + (currentState.isThinking ? 0.18 : 0);
      particles.rotation.y += delta * speed * 0.18;
      gridMaterial.uniforms.uTime.value = elapsed;

      ripples.forEach((ripple) => {
        ripple.age += delta;
        const progress = Math.min(ripple.age / 1.2, 1);
        ripple.mesh.scale.setScalar(1 + progress * 2.3);
        ripple.mesh.material.opacity = 0.7 * (1 - progress);
      });

      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(render);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(animationFrame);
      } else {
        clock.getDelta();
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("click", handleClick);
    document.addEventListener("visibilitychange", handleVisibility);
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("click", handleClick);
      document.removeEventListener("visibilitychange", handleVisibility);
      whiteShell.geometry.dispose();
      redShell.geometry.dispose();
      core.geometry.dispose();
      rings.forEach((ring) => ring.geometry.dispose());
      particleGeometry.dispose();
      gridGeometry.dispose();
      whiteMaterial.dispose();
      redMaterial.dispose();
      coreMaterial.dispose();
      ringMaterials.forEach((material) => material.dispose());
      particleMaterial.dispose();
      gridMaterial.dispose();
      glowMaterial.dispose();
      glowTexture.dispose();
      ripples.forEach((ripple) => {
        ripple.mesh.geometry.dispose();
        ripple.mesh.material.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [enabled, quality]);

  return <div ref={mountRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />;
}

"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export type ThreeBackgroundQuality = "low" | "high";

export type ThreeBackgroundProps = {
  enabled: boolean;
  quality: ThreeBackgroundQuality;
  isThinking: boolean;
  hasMessages: boolean;
  typingEnergy: number;
};

function createRadialTexture(
  centerColor: string,
  middleColor: string,
  size: number,
  softness = 1,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  if (context) {
    const radius = size / 2;
    const gradient = context.createRadialGradient(
      radius,
      radius,
      0,
      radius,
      radius,
      radius,
    );
    gradient.addColorStop(0, centerColor);
    gradient.addColorStop(0.26, middleColor);
    gradient.addColorStop(Math.min(0.78, 0.52 * softness), "rgba(0, 0, 0, 0.12)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function ThreeBackground({
  enabled,
  quality,
  isThinking,
  hasMessages,
  typingEnergy,
}: ThreeBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    isThinking,
    hasMessages,
    typingEnergy,
    burst: 0,
  });

  useEffect(() => {
    stateRef.current = {
      ...stateRef.current,
      isThinking,
      hasMessages,
      typingEnergy,
    };
  }, [isThinking, hasMessages, typingEnergy]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !enabled) {
      return undefined;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: quality === "high",
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (error) {
      console.warn(
        "KAEL: ambient 3D is unavailable because WebGL could not start.",
        error,
      );
      return undefined;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const pixelRatioCap = quality === "high" ? 1.6 : 1;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.pointerEvents = "none";
    renderer.domElement.style.opacity = "0";
    renderer.domElement.style.transition = "opacity 700ms ease";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 60);
    camera.position.set(0, 0, 7.5);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.22);
    scene.add(ambientLight);

    const pinkLight = new THREE.PointLight(0xf093fb, 2.6, 14, 2);
    pinkLight.position.set(2.6, 1.9, 3.4);
    scene.add(pinkLight);

    const coralLight = new THREE.PointLight(0xf5576c, 2.3, 14, 2);
    coralLight.position.set(-2.8, -1.5, 2.8);
    scene.add(coralLight);

    const violetLight = new THREE.PointLight(0x7c3aed, 1.1, 12, 2);
    violetLight.position.set(0.4, -0.8, -3.2);
    scene.add(violetLight);

    const root = new THREE.Group();
    scene.add(root);

    const spinner = new THREE.Group();
    root.add(spinner);

    const outerGeometry = new THREE.IcosahedronGeometry(1.04, 1);
    const outerMaterial = new THREE.MeshBasicMaterial({
      color: 0xf093fb,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    });
    const outerShell = new THREE.Mesh(outerGeometry, outerMaterial);
    spinner.add(outerShell);

    const innerGeometry = new THREE.OctahedronGeometry(0.68, 0);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5576c,
      emissive: 0xf093fb,
      emissiveIntensity: 0.6,
      metalness: 0.38,
      roughness: 0.36,
      wireframe: true,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
    });
    const innerShell = new THREE.Mesh(innerGeometry, innerMaterial);
    innerShell.rotation.set(0.38, 0.42, 0.16);
    spinner.add(innerShell);

    const coreGeometry = new THREE.IcosahedronGeometry(0.38, 1);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xf093fb,
      wireframe: true,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const innerCore = new THREE.Mesh(coreGeometry, coreMaterial);
    innerCore.rotation.set(-0.22, 0.6, 0.14);
    spinner.add(innerCore);

    const glowTexture = createRadialTexture(
      "rgba(255, 255, 255, 0.92)",
      "rgba(245, 87, 108, 0.46)",
      128,
      0.8,
    );
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xf5576c,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.setScalar(3.4);
    root.add(glow);

    const ripeTexture = createRadialTexture(
      "rgba(240, 147, 251, 0.82)",
      "rgba(245, 87, 108, 0.3)",
      256,
      1.2,
    );
    const ripeMaterial = new THREE.SpriteMaterial({
      map: ripeTexture,
      color: 0xf093fb,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const ripeHalo = new THREE.Sprite(ripeMaterial);
    ripeHalo.scale.setScalar(5.2);
    ripeHalo.position.set(0.2, 0.1, -0.4);
    root.add(ripeHalo);

    const orbitGeometry = new THREE.TorusGeometry(1.72, 0.0035, 3, 160);
    const orbitMaterial = new THREE.MeshBasicMaterial({
      color: 0xf093fb,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const orbitRing = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbitRing.rotation.set(1.14, 0.16, -0.24);
    spinner.add(orbitRing);

    const secondOrbitGeometry = new THREE.TorusGeometry(2.24, 0.0028, 3, 160);
    const secondOrbitMaterial = new THREE.MeshBasicMaterial({
      color: 0xf5576c,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const secondOrbitRing = new THREE.Mesh(
      secondOrbitGeometry,
      secondOrbitMaterial,
    );
    secondOrbitRing.rotation.set(1.02, -0.4, 0.32);
    spinner.add(secondOrbitRing);

    const burstGeometry = new THREE.TorusGeometry(1.28, 0.005, 3, 160);
    const burstMaterial = new THREE.MeshBasicMaterial({
      color: 0xf093fb,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const burstRing = new THREE.Mesh(burstGeometry, burstMaterial);
    burstRing.rotation.set(1.05, 0.2, -0.1);
    spinner.add(burstRing);

    const diskGroup = new THREE.Group();
    diskGroup.rotation.x = 1.15;
    root.add(diskGroup);

    const particleCount = quality === "high" ? 620 : 320;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const coral = new THREE.Color(0xf5576c);
    const pink = new THREE.Color(0xf093fb);
    const violet = new THREE.Color(0x7c3aed);
    const blue = new THREE.Color(0x1d4ed8);
    const white = new THREE.Color(0xe4e4e7);

    for (let index = 0; index < particleCount; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.55 + Math.sqrt(Math.random()) * 1.32;
      const spread = 1.2 - ((radius - 1.55) / 1.32) * 0.55;
      const offset = index * 3;

      particlePositions[offset] = Math.cos(angle) * radius;
      particlePositions[offset + 1] =
        (Math.random() - 0.5) * 0.075 * spread;
      particlePositions[offset + 2] = Math.sin(angle) * radius;

      const pick = Math.random();
      const color =
        pick < 0.5
          ? coral
          : pick < 0.78
            ? pink
            : pick < 0.9
              ? violet
              : pick < 0.97
                ? blue
                : white;
      const intensity = 0.52 + Math.random() * 0.58;

      particleColors[offset] = color.r * intensity;
      particleColors[offset + 1] = color.g * intensity;
      particleColors[offset + 2] = color.b * intensity;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3),
    );
    particleGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(particleColors, 3),
    );
    particleGeometry.computeBoundingSphere();

    const particleTexture = createRadialTexture(
      "rgba(255, 255, 255, 1)",
      "rgba(255, 255, 255, 0.36)",
      64,
      0.6,
    );
    const particleMaterial = new THREE.PointsMaterial({
      map: particleTexture,
      size: quality === "high" ? 0.032 : 0.04,
      transparent: true,
      opacity: 0.84,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const disk = new THREE.Points(particleGeometry, particleMaterial);
    diskGroup.add(disk);

    const bokehGroup = new THREE.Group();
    root.add(bokehGroup);

    const bokehCount = quality === "high" ? 150 : 80;
    const bokehPositions = new Float32Array(bokehCount * 3);
    const bokehColors = new Float32Array(bokehCount * 3);

    for (let index = 0; index < bokehCount; index += 1) {
      const radius = 2.8 + Math.random() * 2.7;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const offset = index * 3;

      bokehPositions[offset] = radius * Math.sin(phi) * Math.cos(theta);
      bokehPositions[offset + 1] = radius * Math.cos(phi) * 0.72;
      bokehPositions[offset + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const pick = Math.random();
      const color = pick < 0.48 ? pink : pick < 0.86 ? coral : white;
      const intensity = 0.4 + Math.random() * 0.5;

      bokehColors[offset] = color.r * intensity;
      bokehColors[offset + 1] = color.g * intensity;
      bokehColors[offset + 2] = color.b * intensity;
    }

    const bokehGeometry = new THREE.BufferGeometry();
    bokehGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(bokehPositions, 3),
    );
    bokehGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(bokehColors, 3),
    );
    bokehGeometry.computeBoundingSphere();

    const bokehTexture = createRadialTexture(
      "rgba(255, 255, 255, 0.72)",
      "rgba(240, 147, 251, 0.28)",
      128,
      1.5,
    );
    const bokehMaterial = new THREE.PointsMaterial({
      map: bokehTexture,
      size: quality === "high" ? 0.17 : 0.22,
      transparent: true,
      opacity: 0.14,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const bokeh = new THREE.Points(bokehGeometry, bokehMaterial);
    bokehGroup.add(bokeh);

    const pointerTarget = new THREE.Vector2(0, 0);
    const pointerCurrent = new THREE.Vector2(0, 0);
    const timer = new THREE.Timer();
    timer.connect(document);

    let compact = false;
    let baseX = 0;
    let baseY = 0;
    let animationFrame = 0;
    let running = false;

    const resize = () => {
      const width = mount.clientWidth || window.innerWidth;
      const height = mount.clientHeight || window.innerHeight;
      compact = width < 900;
      baseX = compact ? 1.05 : 2.4;
      baseY = compact ? 0.62 : 0.1;

      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, pixelRatioCap),
      );
      renderer.setSize(width, height, false);

      if (!running) {
        renderer.render(scene, camera);
      }
    };

    const renderFrame = () => {
      if (!running) {
        return;
      }

      timer.update();
      const delta = Math.min(timer.getDelta(), 0.05);
      const elapsed = timer.getElapsed();
      const currentState = stateRef.current;
      currentState.burst = Math.max(0, currentState.burst - delta * 1.7);
      const burst = currentState.burst;
      const typing = THREE.MathUtils.clamp(currentState.typingEnergy, 0, 1);
      const speed =
        (currentState.isThinking ? 2.15 : 0.52) + typing * 1.45;
      const targetScale =
        (currentState.hasMessages
          ? compact
            ? 0.9
            : 0.82
          : compact
            ? 0.94
            : 1) *
        (1 + burst * 0.055 + typing * 0.04);
      const pulse = currentState.isThinking
        ? 1 + Math.sin(elapsed * 4.4) * 0.035
        : 1 + Math.sin(elapsed * 0.9) * 0.008;

      pointerCurrent.lerp(pointerTarget, 0.06);

      const targetX =
        baseX +
        pointerCurrent.x * (0.16 + burst * 0.05) +
        (currentState.hasMessages ? (compact ? 0.1 : 0.34) : 0);
      const targetY = baseY + pointerCurrent.y * 0.11;

      root.position.x += (targetX - root.position.x) * 0.04;
      root.position.y += (targetY - root.position.y) * 0.04;
      root.rotation.x = pointerCurrent.y * 0.07 + burst * 0.02;
      root.rotation.y = -0.14 + pointerCurrent.x * 0.13;
      root.rotation.z = pointerCurrent.x * 0.018;
      root.scale.setScalar(
        root.scale.x + (targetScale * pulse - root.scale.x) * 0.055,
      );

      spinner.rotation.y += delta * (speed * 0.72 + typing * 0.34);
      outerShell.rotation.x += delta * speed * 0.18;
      innerShell.rotation.y -= delta * (speed * 1.15 + typing * 1.4);
      innerShell.rotation.z += delta * speed * 0.34;
      innerCore.rotation.y -= delta * (speed * 1.7 + typing * 2.1);
      innerCore.rotation.x += delta * speed * 0.42;

      const corePulse =
        1 +
        Math.sin(elapsed * (currentState.isThinking ? 5.2 : 1.8)) *
          (currentState.isThinking ? 0.1 : 0.03) +
        burst * 0.12 +
        typing * 0.07;
      innerShell.scale.setScalar(corePulse);
      innerCore.scale.setScalar(1 + typing * 0.14 + burst * 0.08);
      disk.rotation.y += delta * ((currentState.isThinking ? 0.85 : 0.18) + typing * 0.6);
      diskGroup.rotation.z = pointerCurrent.x * 0.06;
      bokehGroup.rotation.y -= delta * (0.04 + typing * 0.16);
      bokehGroup.rotation.x += delta * 0.012;
      orbitRing.rotation.z += delta * 0.1 * speed;
      secondOrbitRing.rotation.z -= delta * 0.07 * speed;

      const burstProgress = 1 - burst;
      burstRing.scale.setScalar(1 + burstProgress * 1.9);
      burstMaterial.opacity = burst * 0.34;
      burstRing.rotation.z += delta * 0.5;

      const glowTarget =
        (currentState.hasMessages ? 0.24 : 0.4) +
        (currentState.isThinking ? 0.16 : 0) +
        burst * 0.28 +
        typing * 0.2;
      glowMaterial.opacity = THREE.MathUtils.lerp(
        glowMaterial.opacity,
        glowTarget,
        0.06,
      );
      glow.scale.setScalar(
        3.4 + Math.sin(elapsed * 1.4) * 0.12 + burst * 0.55 + typing * 0.3,
      );
      glow.position.x = -pointerCurrent.x * 0.18;
      glow.position.y = -pointerCurrent.y * 0.12;

      ripeMaterial.opacity = THREE.MathUtils.lerp(
        ripeMaterial.opacity,
        0.14 + typing * 0.12 + (currentState.isThinking ? 0.08 : 0),
        0.05,
      );
      ripeHalo.scale.setScalar(
        5.2 + Math.sin(elapsed * 0.8) * 0.16 + burst * 0.7 + typing * 0.4,
      );

      particleMaterial.opacity =
        (currentState.isThinking ? 0.94 : 0.82) +
        typing * 0.08 +
        burst * 0.05;
      bokehMaterial.opacity = 0.12 + typing * 0.1 + burst * 0.04;
      outerMaterial.opacity =
        (currentState.isThinking ? 0.3 : 0.2) + typing * 0.06;
      coreMaterial.opacity = 0.46 + typing * 0.14 + burst * 0.1;
      innerMaterial.emissiveIntensity =
        0.55 + typing * 0.5 + (currentState.isThinking ? 0.28 : 0);

      pinkLight.intensity =
        2.6 + typing * 2.6 + (currentState.isThinking ? 0.8 : 0) + burst * 1.2;
      coralLight.intensity =
        2.3 + typing * 2.2 + (currentState.isThinking ? 0.6 : 0) + burst * 1;
      violetLight.intensity = 1.1 + typing * 0.7;

      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(renderFrame);
    };

    const start = () => {
      if (running || reducedMotion) {
        return;
      }
      running = true;
      timer.update();
      animationFrame = window.requestAnimationFrame(renderFrame);
    };

    const stop = () => {
      running = false;
      window.cancelAnimationFrame(animationFrame);
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerTarget.set(
        (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2,
        (0.5 - event.clientY / Math.max(window.innerHeight, 1)) * 2,
      );

      if (reducedMotion) {
        pointerCurrent.copy(pointerTarget);
        root.position.set(
          baseX + pointerCurrent.x * 0.16,
          baseY + pointerCurrent.y * 0.11,
          0,
        );
        root.rotation.x = pointerCurrent.y * 0.07;
        root.rotation.y = -0.14 + pointerCurrent.x * 0.13;
        renderer.render(scene, camera);
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };

    const handlePointerDown = () => {
      stateRef.current.burst = 1;
      start();
    };

    resize();
    root.position.set(baseX, baseY, 0);
    renderer.render(scene, camera);
    void renderer.domElement.offsetWidth;
    renderer.domElement.style.opacity = "1";

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("pointerdown", handlePointerDown, {
      passive: true,
    });
    document.addEventListener("visibilitychange", handleVisibility);
    start();

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("visibilitychange", handleVisibility);

      outerGeometry.dispose();
      innerGeometry.dispose();
      coreGeometry.dispose();
      orbitGeometry.dispose();
      secondOrbitGeometry.dispose();
      burstGeometry.dispose();
      particleGeometry.dispose();
      bokehGeometry.dispose();
      outerMaterial.dispose();
      innerMaterial.dispose();
      coreMaterial.dispose();
      glowMaterial.dispose();
      ripeMaterial.dispose();
      orbitMaterial.dispose();
      secondOrbitMaterial.dispose();
      burstMaterial.dispose();
      particleMaterial.dispose();
      bokehMaterial.dispose();
      glowTexture.dispose();
      ripeTexture.dispose();
      particleTexture.dispose();
      bokehTexture.dispose();
      timer.dispose();

      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [enabled, quality]);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    />
  );
}

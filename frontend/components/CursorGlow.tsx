"use client";

import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const orbRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!finePointer.matches || reducedMotion.matches) {
      return undefined;
    }

    const orb = orbRef.current;
    const dot = dotRef.current;
    if (!orb || !dot) {
      return undefined;
    }

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let orbX = targetX;
    let orbY = targetY;
    let dotX = targetX;
    let dotY = targetY;
    let targetScale = 1;
    let currentScale = 1;
    let hovering = false;
    let pressed = false;
    let visible = false;
    let raf = 0;
    let lastTime = 0;

    const setVisible = (next: boolean) => {
      visible = next;
      orb.style.opacity = next ? "1" : "0";
      dot.style.opacity = next ? "1" : "0";
    };

    const frame = (time: number) => {
      const delta = lastTime ? Math.min((time - lastTime) / 16.667, 3) : 1;
      lastTime = time;

      const orbEase = 1 - Math.pow(0.84, delta);
      const dotEase = 1 - Math.pow(0.58, delta);
      const scaleEase = 1 - Math.pow(0.7, delta);

      orbX += (targetX - orbX) * orbEase;
      orbY += (targetY - orbY) * orbEase;
      dotX += (targetX - dotX) * dotEase;
      dotY += (targetY - dotY) * dotEase;
      currentScale += (targetScale - currentScale) * scaleEase;

      orb.style.transform = `translate3d(${orbX}px, ${orbY}px, 0) translate(-50%, -50%) scale(${currentScale})`;
      dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%) scale(${Math.max(
        0.6,
        currentScale * 0.82,
      )})`;

      const orbSettled =
        Math.abs(targetX - orbX) < 0.15 && Math.abs(targetY - orbY) < 0.15;
      const dotSettled =
        Math.abs(targetX - dotX) < 0.15 && Math.abs(targetY - dotY) < 0.15;
      const scaleSettled = Math.abs(targetScale - currentScale) < 0.002;

      if (orbSettled && dotSettled && scaleSettled) {
        raf = 0;
        lastTime = 0;
        return;
      }

      raf = window.requestAnimationFrame(frame);
    };

    const schedule = () => {
      if (!raf) {
        raf = window.requestAnimationFrame(frame);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;

      document.documentElement.style.setProperty(
        "--kael-px",
        `${event.clientX}px`,
      );
      document.documentElement.style.setProperty(
        "--kael-py",
        `${event.clientY}px`,
      );

      if (!visible) {
        orbX = targetX;
        orbY = targetY;
        dotX = targetX;
        dotY = targetY;
        setVisible(true);
      }

      schedule();
    };

    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      hovering = Boolean(
        target.closest(
          "a, button, input, textarea, select, [role='button'], [role='option']",
        ),
      );
      targetScale = pressed ? 1.32 : hovering ? 1.18 : 1;
      schedule();
    };

    const handlePointerDown = () => {
      pressed = true;
      targetScale = 1.34;
      schedule();
    };

    const handlePointerUp = () => {
      pressed = false;
      targetScale = hovering ? 1.18 : 1;
      schedule();
    };

    const handlePointerLeave = () => {
      setVisible(false);
    };

    const handlePointerEnter = () => {
      setVisible(true);
      schedule();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        setVisible(false);
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerover", handlePointerOver, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.documentElement.addEventListener(
      "pointerleave",
      handlePointerLeave,
      { passive: true },
    );
    document.documentElement.addEventListener(
      "pointerenter",
      handlePointerEnter,
      { passive: true },
    );
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerover", handlePointerOver);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      document.documentElement.removeEventListener(
        "pointerleave",
        handlePointerLeave,
      );
      document.documentElement.removeEventListener(
        "pointerenter",
        handlePointerEnter,
      );
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <>
      <div ref={orbRef} aria-hidden="true" className="kael-cursor-glow" />
      <div ref={dotRef} aria-hidden="true" className="kael-cursor-dot" />
    </>
  );
}

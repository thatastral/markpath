"use client";
import { useEffect } from "react";

/**
 * Moves focus into the step that just opened: the field or button marked `data-autofocus`,
 * otherwise the step heading, so keyboard and screen reader users start in the right place.
 * Render it with `key={stepId}` so it runs once per step.
 */
export function StepFocus({ container }: { container: string }) {
  useEffect(() => {
    const root = document.getElementById(container); if (!root) return;
    const target = root.querySelector<HTMLElement>("[data-autofocus]") ?? root.querySelector<HTMLElement>("h1");
    target?.focus({ preventScroll: true });
    // On phones the step list scrolls sideways: keep the current step in view.
    document.querySelector<HTMLElement>('[aria-current="step"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [container]);
  return null;
}

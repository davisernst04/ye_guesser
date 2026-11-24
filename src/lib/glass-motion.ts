import { useTransform, useVelocity, type MotionValue } from "motion/react";

// A soft spring with a little overshoot, like the iOS segmented control.
export const SPRING = { type: "spring", stiffness: 380, damping: 30, mass: 0.9 } as const;

/** Squash and stretch for a sliding glass pill: the faster `x` moves, the wider and flatter it gets. */
export function useStretch(x: MotionValue<number>) {
  const speed = useTransform(useVelocity(x), (v) => Math.min(Math.abs(v) / 1500, 1));
  const scaleX = useTransform(speed, (s) => 1 + s * 0.18);
  const scaleY = useTransform(speed, (s) => 1 - s * 0.12);
  return { speed, scaleX, scaleY };
}

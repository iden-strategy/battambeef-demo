// Desktop pointer effects (MagneticButton, TiltCard, pointer depth). This module is downloaded only when a
// fine pointer is present and motion is allowed, so phones never load it. Same springs and
// maths as the previous React versions (useSpring / useTransform), built on Motion's
// framework-free value helpers.

import { mapValue, motionValue, springValue, styleEffect, transformValue } from "motion";

/** MagneticButton: moves up to `strength` px toward the cursor, springs back on leave or blur. */
export function attachMagnetic(el: HTMLElement, strength: number) {
  const spring = { stiffness: 260, damping: 18, mass: 0.6 };
  const x = motionValue(0);
  const y = motionValue(0);
  const sx = springValue(x, spring);
  const sy = springValue(y, spring);
  const stopStyle = styleEffect(el, { x: sx, y: sy });

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    x.set(Math.max(-1, Math.min(1, dx)) * strength);
    y.set(Math.max(-1, Math.min(1, dy)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerleave", reset);
  el.addEventListener("focusout", reset);

  return () => {
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerleave", reset);
    el.removeEventListener("focusout", reset);
    stopStyle();
    [x, y, sx, sy].forEach((v) => v.destroy());
    el.style.transform = "";
  };
}

export type DepthLayer = {
  el: HTMLElement;
  /**
   * Largest shift, in percent of the root's width (x) and height (y). Positive layers follow the
   * cursor, negative ones move against it: layers with opposite signs read as near and far.
   */
  amount: number;
};

/**
 * Pointer depth: each layer shifts with the cursor position over `root` on a soft spring, and
 * settles back to centre when the cursor leaves. Transform only.
 */
export function attachDepth(root: HTMLElement, layers: DepthLayer[]) {
  const spring = { stiffness: 120, damping: 22 };
  const px = motionValue(0); // -1 (left edge) … 1 (right edge)
  const py = motionValue(0);
  const sx = springValue(px, spring);
  const sy = springValue(py, spring);
  let width = root.offsetWidth;
  let height = root.offsetHeight;
  const ro = new ResizeObserver(() => {
    width = root.offsetWidth;
    height = root.offsetHeight;
  });
  ro.observe(root);

  const values = layers.map(({ amount }) => ({
    x: transformValue(() => (sx.get() * amount * width) / 100),
    y: transformValue(() => (sy.get() * amount * height) / 100),
  }));
  const stops = layers.map(({ el }, i) => styleEffect(el, values[i]));

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = root.getBoundingClientRect();
    px.set(Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2))));
    py.set(Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2))));
  };
  const reset = () => {
    px.set(0);
    py.set(0);
  };
  root.addEventListener("pointermove", onMove);
  root.addEventListener("pointerleave", reset);

  return () => {
    root.removeEventListener("pointermove", onMove);
    root.removeEventListener("pointerleave", reset);
    ro.disconnect();
    stops.forEach((stop) => stop());
    values.forEach((v) => {
      v.x.destroy();
      v.y.destroy();
    });
    [px, py, sx, sy].forEach((v) => v.destroy());
    layers.forEach(({ el }) => (el.style.transform = ""));
  };
}

/** TiltCard: tilts up to `maxTilt`° toward the cursor; the optional sheen follows it. */
export function attachTilt(el: HTMLElement, sheenEl: HTMLElement | null, maxTilt: number) {
  const spring = { stiffness: 260, damping: 30 };
  // Pointer position inside the card, 0..1.
  const px = motionValue(0.5);
  const py = motionValue(0.5);
  const rotateX = springValue(mapValue(py, [0, 1], [maxTilt, -maxTilt]), spring);
  const rotateY = springValue(mapValue(px, [0, 1], [-maxTilt, maxTilt]), spring);
  const glare = springValue<number>(0, spring);
  const transform = transformValue(() => `perspective(900px) rotateX(${rotateX.get()}deg) rotateY(${rotateY.get()}deg)`);
  const stops = [styleEffect(el, { transform })];
  if (sheenEl) {
    // The sheen is a large soft spot moved with transforms, not a repainted gradient.
    const sheenX = mapValue(px, [0, 1], ["-25%", "25%"]);
    const sheenY = mapValue(py, [0, 1], ["-25%", "25%"]);
    const sheenOpacity = transformValue(() => glare.get() * 0.9);
    stops.push(styleEffect(sheenEl, { x: sheenX, y: sheenY, opacity: sheenOpacity }));
  }

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
    glare.set(1);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
    glare.set(0);
  };
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerleave", onLeave);

  return () => {
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerleave", onLeave);
    stops.forEach((stop) => stop());
    [px, py, rotateX, rotateY, glare, transform].forEach((v) => v.destroy());
    el.style.transform = "";
    if (sheenEl) sheenEl.style.cssText = "";
  };
}

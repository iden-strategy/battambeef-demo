// Plain module (no "use client") so server components can mark cursor targets too.

export type CursorLabel = "drag" | "explore" | "view";

/** Spread onto any element to make the CursorFollower grow with a label over it. */
export const cursorTarget = (label: CursorLabel) => ({ "data-cursor": label });

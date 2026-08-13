// Safari-safe ring implementation using outline to avoid layout shift bug in Safari <v26
// Uses outline instead of box-shadow because Safari has a bug where applying ring-offset-2
// dynamically causes layout reflow. With outline, the structure is always present (transparent)
// and only the color changes, preventing layout shifts while maintaining smooth transitions.

export const baseRing =
  "outline outline-2 outline-transparent outline-offset-2";

export const focusWithinRing = `${baseRing} [&:focus-within,&[data-focus=true]]:outline-[var(--tw-ring-color,var(--color-control-ring))]`;
export const focusVisibleRing = `${baseRing} [&:focus-visible,&:has(:focus-visible),&[data-focus=true]]:outline-[var(--tw-ring-color,var(--color-control-ring))]`;
export const focusRing = `${baseRing} [&:focus,&:focus-visible,&[data-focus=true]]:outline-[var(--tw-ring-color,var(--color-control-ring))]`;
export const activeRing = `${baseRing} active:outline-[var(--tw-ring-color,var(--color-control-ring))]`;
export const groupFocusRing = `${baseRing} group-focus-within:outline-[var(--tw-ring-color,var(--color-control-ring))]`;

export const ringClasses = `${focusWithinRing}`;
export const groupRingClasses = `${ringClasses} ${groupFocusRing}`;
export const invalidRingClasses =
  "aria-invalid:outline-[var(--color-danger-ring)]!";

// The always-on counterpart: a surface in a deliberate mode, not one reporting a
// fault, so primary rather than danger and unconditional rather than state-gated.
// It carries its own width and offset because nothing has to be reserved — the
// outline appears and disappears without moving a pixel of the surface it rings.
export const highlightRingClasses =
  "outline outline-2 outline-offset-4 outline-[var(--color-primary-default)]";

// Persistent ring (always shown, not just on focus)
export const persistentRing = "ring-2 ring-control-ring";

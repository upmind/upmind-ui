// Safari-safe ring implementation using outline to avoid layout shift bug in Safari <v26
// Uses outline instead of box-shadow because Safari has a bug where applying ring-offset-2
// dynamically causes layout reflow. With outline, the structure is always present (transparent)
// and only the color changes, preventing layout shifts while maintaining smooth transitions.

export const baseRing =
  "outline outline-2 outline-transparent outline-offset-2 transition-[outline-color] duration-200";

export const focusWithinRing = `${baseRing} [&:focus-within,&[data-focus=true]]:outline-[var(--color-control-ring)]`;
export const activeRing = `${baseRing} active:outline-[var(--color-control-ring)]`;
export const groupFocusRing = `${baseRing} group-focus-within:outline-[var(--color-control-ring)]`;

export const ringClasses = `${focusWithinRing}`;
export const groupRingClasses = `${ringClasses} ${groupFocusRing}`;
export const invalidRingClasses =
  "aria-invalid:outline-[var(--color-danger-ring)]!";

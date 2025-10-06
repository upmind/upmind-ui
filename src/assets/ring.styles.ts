export const baseRing =
  "ring-2 ring-bg-control-ring focus:ring-offset-2 focus-within:ring-offset-2 ring-offset-bg-surface";

export const outlineReset = "outline-hidden focus-within:outline-hidden";

export const focusVisibleRing = `[&:focus-visible,&[data-focus=true]]:${baseRing}`;
export const focusWithinRing = `focus-within:${baseRing}`;
export const activeRing = `active:${baseRing}`;
export const groupFocusRing = `group-focus-within:${baseRing}`;

export const ringClasses = `${outlineReset} ${focusVisibleRing} ${focusWithinRing} ${activeRing}`;
export const groupRingClasses = `${ringClasses} ${groupFocusRing}`;
export const invalidRingClasses =
  "aria-invalid:ring-invalid! aria-invalid:ring-2!";

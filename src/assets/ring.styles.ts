export const baseRing =
  "[&:focus-visible,&[data-focus=true]]:ring-2 ring-bg-control-ring [&:focus,&[data-focus=true]]:ring-offset-2 focus-within:ring-offset-2 ring-offset-surface";

export const outlineReset = "outline-hidden focus-within:outline-hidden";

export const focusVisibleRing = `${baseRing}`;
export const focusWithinRing = `focus-within:${baseRing}`;
export const activeRing = `active:${baseRing}`;
export const groupFocusRing = `group-focus-within:${baseRing}`;

export const ringClasses = `${outlineReset} ${focusVisibleRing} ${focusWithinRing} ${activeRing}`;
export const groupRingClasses = `${ringClasses} ${groupFocusRing}`;
export const invalidRingClasses =
  "aria-invalid:ring-danger-ring! aria-invalid:ring-2!";

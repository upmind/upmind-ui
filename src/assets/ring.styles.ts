export const baseRing =
  "[&:focus,&[data-focus=true]]:ring-2 focus-within:ring-2 ring-control-ring [&:focus,&[data-focus=true]]:ring-offset-2 focus-within:ring-offset-2 ring-offset-surface";

export const outlineReset = "outline-hidden focus-within:outline-hidden";

export const focusWithinRing = `focus-within:${baseRing} focus-within:ring-control-ring`;
export const activeRing = `active:${baseRing}`;
export const groupFocusRing = `group-focus-within:${baseRing}`;

export const ringClasses = `${outlineReset} ${focusWithinRing} ${activeRing}`;
export const groupRingClasses = `${ringClasses} ${groupFocusRing}`;
export const invalidRingClasses =
  "aria-invalid:ring-danger-ring! aria-invalid:ring-2!";

// TODO: We should be able to override these values individually
export const ringClasses =
  "outline-hidden focus-within:outline-hidden focus-visible:ring-2 ring-control-active focus-visible:ring-control-transparent focus-visible:ring-offset-2 focus-within:ring-2 focus-within:ring-control-active focus-within:ring-offset-2 active:ring-2 active:ring-control-active active:ring-offset-2";

export const groupRingClasses = `${ringClasses} group-focus-within:ring-2 group-focus-within:ring-control-active group-focus-within:ring-offset-2`;

export const invalidRingClasses =
  "aria-invalid:ring-invalid! aria-invalid:ring-2! aria-invalid:ring-offset-2!";

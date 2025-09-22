// TODO: We should be able to override these values individually
export const ringClasses =
  "outline-hidden focus-within:outline-hidden [&:focus-visible,&[data-focus=true]]:ring-2 [&:focus-visible,&[data-focus=true]]:ring-ring-control focus-within:ring-2 focus-within:ring-ring-control active:ring-2 active:ring-ring-control";

export const groupRingClasses = `${ringClasses} group-focus-within:ring-2 group-focus-within:ring-ring-control`;

export const invalidRingClasses =
  "aria-invalid:ring-invalid! aria-invalid:ring-2!";

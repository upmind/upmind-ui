// TODO: We should be able to override these values individually
export const ringClasses =
  "outline-hidden focus-within:outline-hidden [&:focus-visible,&[data-focus=true]]:ring-2 [&:focus-visible,&[data-focus=true]]:ring-ring-control [&:focus-visible,&[data-focus=true]]:ring-offset-2 [&:focus-visible,&[data-focus=true]]:ring-offset-background-surface focus-within:ring-2 focus-within:ring-ring-control focus-within:ring-offset-2 focus-within:ring-offset-background-surface active:ring-2 active:ring-ring-control active:ring-offset-2 active:ring-offset-background-surface";

export const groupRingClasses = `${ringClasses} group-focus-within:ring-2 group-focus-within:ring-ring-control group-focus-within:ring-offset-2 group-focus-within:ring-offset-background-surface`;

export const invalidRingClasses =
  "aria-invalid:ring-invalid! aria-invalid:ring-2!";

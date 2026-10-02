import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const rootVariants = cva("flex min-h-24 flex-col gap-5");

export const gatewayFormVariants = cva(
  "flex w-full flex-col justify-center gap-6",
  {
    variants: {
      hasErrors: {
        true: "border-danger focus-within:ring-danger/20 focus-within:ring-4",
        false: ""
      }
    },
    defaultVariants: { hasErrors: false }
  }
);

export const storedRootVariants = cva("flex flex-col gap-6");

export const footerRootVariants = cva("flex w-full flex-col gap-6");
export const footerActionsVariants = cva(
  "flex flex-col items-stretch justify-start space-y-2 space-x-0 md:flex-row md:space-y-0 md:space-x-4"
);
export const footerTermsVariants = cva("text-muted text-sm");

export const actionVariants = cva(
  "flex w-full self-center md:inline-flex md:w-auto"
);
export const clickwrapVariants = cva(
  "text-muted prose prose-a:font-normal prose-a:text-inherit max-w-full text-left text-sm leading-snug"
);

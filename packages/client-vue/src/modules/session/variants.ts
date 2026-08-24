import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const contentVariants = cva("rounded-card w-full max-w-5xl items-start");
export const markdownVariants = cva("my-6");

export const authRootVariants = cva("flex max-w-3xl flex-col gap-8 text-start");
export const authFormVariants = cva("place-items-start", {
  variants: {
    show2fa: { true: "mt-4" },
    showVerifyEmail: { true: "mt-4" }
  }
});
export const authActionsVariants = cva(
  "mt-3 flex items-center justify-start space-x-2"
);
export const authResendVariants = cva(
  "flex w-full items-center justify-center gap-2 text-sm"
);
export const authResendPromptVariants = cva("text-muted");
export const authResendSendingVariants = cva("text-muted");
export const authResendSentVariants = cva("text-muted");

export const transitionsFadeEnterActiveVariants = cva(
  "transition-opacity duration-200 ease-in-out"
);
export const transitionsFadeEnterFromVariants = cva("opacity-0");
export const transitionsFadeEnterToVariants = cva("opacity-100");
export const transitionsFadeLeaveActiveVariants = cva(
  "transition-opacity duration-200 ease-in-out"
);
export const transitionsFadeLeaveFromVariants = cva("opacity-100");
export const transitionsFadeLeaveToVariants = cva("opacity-0");

export const guestCheckoutVariants = cva("", {
  variants: {
    template: {
      "two-column-ltr": "mt-0 mb-0",
      "two-column-rtl": "mt-0 mb-0",
      enclosed: "mt-0 mb-0",
      split: "mt-0 mb-6",
      "canvas-card": "mt-0 mb-6",
      "surface-box": "mt-6 mb-6",
      inset: ""
    }
  }
});

// Ported from the retired session.config: the inset template lets the form run
// full-width, since the enclosing card already bounds it.
// Both widths sit in the variant rather than base + override, so the two never
// land on the element together and the cap does not depend on stylesheet order.
export const sessionFormWidthVariants = cva("", {
  variants: { inset: { true: "max-w-none", false: "max-w-3xl" } },
  defaultVariants: { inset: false }
});

// Ported from the retired session.config: the hero subtitle under the auth
// heading, shared by the login/register sections.
export const sessionSubtitleVariants = cva("font-normal");

import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export const contentVariants = cva("rounded-card w-full max-w-5xl items-start");
export const markdownVariants = cva("", {
  variants: { flush: { true: "", false: "my-6" } },
  defaultVariants: { flush: false }
});

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

export const guestCheckoutSpacing = {
  flush: "mt-0 mb-0",
  below: "mt-0 mb-6",
  around: "mt-6 mb-6",
  none: ""
};

export const guestCheckoutVariants = cva("", {
  variants: { spacing: guestCheckoutSpacing },
  defaultVariants: { spacing: "flush" }
});

// A carded form runs full-width, since the card already bounds it.
// Both widths sit in the variant rather than base + override, so the two never
// land on the element together and the cap does not depend on stylesheet order.
export const sessionFormWidthVariants = cva("", {
  variants: { card: { true: "max-w-none", false: "max-w-3xl" } },
  defaultVariants: { card: false }
});

// Ported from the retired session.config: the hero subtitle under the auth
// heading, shared by the login/register sections.
export const sessionSubtitleVariants = cva("font-normal");

export const loadingRootVariants = cva(
  "flex w-full items-center justify-center"
);

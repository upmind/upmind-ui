import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  session: {
    root: cva(""),
    header: cva("flex w-full flex-col gap-2"),
    title: cva(
      "start-between m-0 flex w-full items-center gap-4 text-5xl leading-tight font-light text-inherit"
    ),
    name: cva("font-normal"),
    text: cva("text-base-700 m-0 text-lg leading-7 font-light"),
    footer: cva(
      "flex flex-col gap-2 text-sm leading-tight font-light tracking-tight"
    ),
    content: cva("rounded-box w-full max-w-5xl items-start"),
    markdown: cva("my-6"),
    subtitle: cva("font-normal"),

    // Auth form width: capped on every template except one-page, which fills
    // its centred card. Shared by the login/register/recover sections.
    formWidth: cva("max-w-3xl", {
      variants: {
        template: {
          inset: "max-w-none"
        }
      }
    }),

    transition: {
      enter: {
        active: cva("m-0 transition duration-200 ease-out"),
        from: cva("-translate-y-10 transform opacity-0"),
        to: cva("translate-y-0 transform opacity-100")
      },

      leave: {
        active: cva("absolute transition duration-100 ease-in"),
        from: cva("translate-y-0 transform opacity-100"),
        to: cva("-translate-y-1 transform opacity-0")
      }
    },

    auth: {
      container: cva("max-w-3xl"),
      root: cva("flex max-w-3xl flex-col gap-8 text-start"),
      form: cva("place-items-start", {
        variants: {
          show2fa: { true: "mt-4" },
          showVerifyEmail: { true: "mt-4" }
        }
      }),
      actions: cva("mt-3 flex items-center justify-start space-x-2"),
      resend: cva("flex w-full items-center justify-center gap-2 text-sm"),
      resendPrompt: cva("text-muted"),
      resendSending: cva("text-muted"),
      resendSent: cva("text-muted")
    },

    transitions: {
      fade: {
        enter: {
          active: cva("transition-opacity duration-200 ease-in-out"),
          from: cva("opacity-0"),
          to: cva("opacity-100")
        },
        leave: {
          active: cva("transition-opacity duration-200 ease-in-out"),
          from: cva("opacity-100"),
          to: cva("opacity-0")
        }
      }
    },

    guestCheckout: cva("", {
      variants: {
        template: {
          "two-column-ltr": "mt-0 mb-0",
          "two-column-rtl": "mt-0 mb-0",
          enclosed: "mt-0 mb-0",
          split: "mt-0 mb-6",
          "canvas-card": "mt-0 mb-6",
          "surface-box": "mt-6 mb-6"
        }
      }
    }),

    profile: {
      trigger: cva("rounded-full p-0"),
      loading: cva(""),
      label: cva("sr-only"),
      avatar: cva("my-0 size-8")
    },

    expired: {
      // my-8 grid min-h-96 w-full grid-cols-3 justify-center gap-8 px-4 py-8
      root: cva(
        "relative flex w-full flex-col flex-wrap items-center items-start justify-center justify-start gap-6 py-16"
      ),
      title: cva("m-0 text-center text-3xl font-light text-inherit"),
      text: cva(
        "text-base-500 m-0 text-center text-sm leading-5 tracking-tight"
      ),
      avatar: cva("bg-primary text-primary-foreground size-20 p-2")
    }
  }
};

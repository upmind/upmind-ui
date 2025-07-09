// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  page: cva("", {
    variants: {
      route: {
        recommendations: "overflow-hidden",
        "product.recommendations": "overflow-hidden"
      }
    }
  }),
  header: {
    avatar: {
      login: cva("bg-transparent font-bold"),
      session: cva("font-bold")
    }
  },
  button: cva("rounded-xl", {
    variants: {
      size: {
        xs: "h-8 gap-1 px-3 py-1 text-xs",
        sm: "h-10 gap-2 px-4 py-1 text-sm",
        md: "text-md h-12 gap-2 px-6 py-1",
        lg: "h-14 gap-2 px-8 py-1 text-lg",
        xl: "h-16 gap-2 px-8 py-1 text-lg",
        icon: "h-10 w-10 gap-2 px-2 py-1",
        badge: "gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      },
      variant: {
        flat: "border-transparent hover:bg-opacity-90",
        outline: "bg-transparent",
        ghost: "border-transparent",
        link: "!hover:underline border-none !bg-transparent !px-0 !underline-offset-4",
        tonal: "border-transparent",
        inverse: "border-transparent",
        control:
          "!hover:bg-opacity-80 !border-input bg-control !text-control-foreground ring-offset-background font-semibold shadow-sm"
      },
      defaultVariants: {
        size: "md"
      }
    }
  }),
  interstitial: {
    title: cva(
      "text-foreground mb-2 text-balance text-center text-3xl font-medium tracking-normal md:text-4xl"
    )
  },
  title: cva("font-medium"),
  section: {
    title: cva("font-medium")
  }
};

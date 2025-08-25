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
  interstitial: {
    title: cva(
      "text-foreground mb-2 text-center text-3xl font-medium tracking-normal text-balance md:text-4xl"
    )
  }
};

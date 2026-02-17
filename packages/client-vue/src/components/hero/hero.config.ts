import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  hero: {
    root: cva("flex flex-col gap-4"),
    title: cva(
      "font-display flex items-center gap-x-5 text-4xl text-balance md:text-5xl"
    ),
    badge: cva("flex h-lh items-center justify-center font-sans"),
    subtitle: cva("text-lg"),
    description: cva("text-muted text-md")
  }
};

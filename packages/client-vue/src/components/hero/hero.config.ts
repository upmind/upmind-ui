import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  hero: {
    root: cva("flex flex-col gap-1"),
    title: cva("font-display text-4xl text-balance md:text-5xl"),
    description: cva("text-muted text-md-tight md:text-lg")
  }
};

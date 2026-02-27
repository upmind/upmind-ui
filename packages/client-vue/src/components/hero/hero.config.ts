import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
export default {
  hero: {
    root: cva("flex flex-col gap-4"),
    title: cva(
      "font-display flex items-center gap-x-5 text-balance text-4xl md:text-5xl"
    ),
    subtitle: cva("text-lg"),
    description: cva("text-muted text-md")
  }
};

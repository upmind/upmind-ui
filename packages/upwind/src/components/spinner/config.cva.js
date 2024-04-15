import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

export default {
  spinner: {
    root: cva(
      "inline-block animate-spin rounded-[100%] border-[0.2em] border-current border-t-transparent text-current "
    ),
  },
};

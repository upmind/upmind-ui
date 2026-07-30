import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  productSetup: {
    form: {
      root: cva("flex w-full flex-col gap-6"),
      // full-width error alert + Continue submit
      full: cva("w-full")
    }
  }
};

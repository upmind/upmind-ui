import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  button: {
    root: cva("", {}),
  },
  form: {},
  //temp till we have icons resized
  radio: {
    icon: cva("", {
      variants: { size: { sm: "size-3" } },
      defaultVariants: { size: "sm" },
    }),
  },
};

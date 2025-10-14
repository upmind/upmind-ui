import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

// TODO: form size specific taiwind classes... for now we just define the variants
export const formVariants = cva("", {
  variants: {
    size: {
      sm: "",
      md: "",
      lg: "",
      xl: ""
    }
  }
});

export default {
  form: {
    root: cva("relative flex w-full flex-col gap-6"),
    loading: cva(""),
    content: cva("transition-opacity duration-200", {
      variants: {
        disabled: {
          true: "cursor-not-allowed"
        },
        processing: {
          true: "cursor-wait duration-0"
        },
        loading: {
          true: "invisible opacity-0 duration-0"
        }
      },
      defaultVariants: {
        disabled: false,
        processing: false,
        loading: false
      }
    }),
    actions: cva("flex w-full flex-wrap gap-2 transition-all duration-200", {
      variants: {
        disabled: {
          true: "cursor-not-allowed"
        },
        processing: {
          true: "cursor-wait"
        },
        loading: {
          true: "invisible opacity-0 duration-0"
        }
      }
    })
  }
};

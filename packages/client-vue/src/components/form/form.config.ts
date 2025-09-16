import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  form: {
    sld: {
      description: cva(
        "text-emphasis-medium bg-control-background-background-active-muted flex h-10 w-auto min-w-8 items-center justify-center border-l px-4 md:px-6"
      )
    },
    file: cva("bg-input border-input rounded border")
  }
};

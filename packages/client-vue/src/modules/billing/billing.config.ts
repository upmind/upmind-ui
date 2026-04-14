import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export default {
  billing: {
    form: {
      sections: cva("min-h-32")
    },
    loading: {
      root: cva("max-w-3xl"),
      spinner: cva("z-10! w-full rounded")
    },
    card: {
      root: cva("space-y-4")
    },
    summary: {
      root: cva("space-y-1 text-sm"),
      row: cva("flex items-start gap-2 font-medium"),
      label: cva(
        "data-[danger=true]:text-accent-danger data-[danger=false]:text-muted w-24 font-normal"
      ),
      value: cva("flex items-center gap-2"),
      avatar: cva("size-4")
    }
  }
};

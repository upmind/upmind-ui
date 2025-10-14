import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  form: {
    sld: {
      description: cva(
        "text-muted bg-control-surface flex h-10 w-auto min-w-8 items-center justify-center border-l px-4 md:px-6"
      )
    },
    file: cva(
      "bg-control-surface control-radius border-control-default border"
    ),
    image: cva(
      "text-muted control-radius border-control-default mb-4 border transition-all duration-300"
    )
  }
};

import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  product: {
    root: {
      card: cva(
        "relative flex flex-col gap-y-4 !p-6 !py-7 text-inherit md:!p-9 md:!py-10",
        {
          variants: {
            hasErrors: {
              true: "ring-error !ring-error-1 ring-1",
              false:
                "ring-offset-background focus-within:ring-ring focus-within:outline-none focus-within:ring-1 focus-within:ring-offset-1 group-focus-within:ring-0 group-focus-within:ring-offset-0",
            },
          },
        }
      ),
      container: cva("divide-y divide-dashed"),
    },
    summary: {
      container: cva("flex flex-col gap-y-4 py-4 first:pt-0 last:pb-0"),
      image: cva(
        "m-0 h-12 min-w-12 max-w-12 rounded-lg object-cover object-center"
      ),
      imageRoute: cva(""),
    },
    configDetails: {
      container: cva(
        "flex flex-col divide-y divide-solid rounded-lg border bg-gray-50/50 p-4 px-5 text-sm font-medium leading-3"
      ),
    },
  },
};

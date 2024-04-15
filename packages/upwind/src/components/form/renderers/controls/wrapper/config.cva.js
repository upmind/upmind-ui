import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------

export default {
  root: cva("relative flex flex-col gap-1"),
  wrapper: {
    root: cva(
      "border-base-300 focus-within:border-primary focus-within:ring-primary group inline-flex w-full items-center gap-x-3 rounded-lg border px-2 py-0 ring-0 focus-within:ring-4 focus-within:ring-opacity-10"
    ),
    error: cva(
      "border-error-300 focus-within:!border-error focus-within:!ring-error focus-within:!ring-opacity-10"
    ),
    success: cva(
      "border-success-300 focus-within:border-success focus-within:ring-success"
    ),
    disabled: cva("bg-base-100 pointer-events-none opacity-50"),
  },
  icon: cva("size-[1.5em]"),
  avatar: cva("size-[1.5em] overflow-hidden rounded-full"),
  status: {
    error: cva("text-error"),
    success: cva("text-success"),
  },
  prefix: {
    root: cva(
      "bg-base-100 -ml-2 flex items-center self-stretch rounded-s-lg p-3"
    ),
    error: cva(""),
    success: cva(""),
  },
  suffix: {
    root: cva(
      "bg-base-100 -mr-2 flex items-center self-stretch rounded-e-lg p-3"
    ),
    error: cva(""),
    success: cva(""),
  },
  label: {
    root: cva(
      "text-base-content flex w-full items-center justify-between gap-x-3"
    ),
    text: cva("text-[0.875em]"),
    required: cva("text-base-500 text-xs leading-tight"),
    optional: cva("text-base-500 text-xs leading-tight"),
    error: cva(""),
    success: cva(""),
  },
  feedback: {
    root: cva("flex items-center text-xs"),
    hidden: cva("invisible w-0 overflow-hidden text-nowrap"),
    error: cva("text-error flex items-center gap-x-3"),
    description: cva("text-base-content flex items-center gap-x-2"),
    transition: {
      enter: {
        // active: cva("m-0 transition duration-100 ease-out"),
        // from: cva("-translate-y-1 transform opacity-0"),
        // to: cva("translate-y-0 transform opacity-100"),
        active: cva("m-0 transition duration-100 ease-out"),
        from: cva("transform opacity-0"),
        to: cva("transform opacity-100"),
      },
      leave: {
        // active: cva("absolute transition duration-75 ease-in"),
        // from: cva("translate-y-0 transform opacity-100"),
        // to: cva("-translate-y-1 transform opacity-0"),
        active: cva("absolute transition duration-75 ease-in"),
        from: cva("transform opacity-100"),
        to: cva("transform opacity-0"),
      },
    },
  },
  // ------------------------------------------------------------
  // Attribute based Classes: These are conditional based on the component props
  // Each Attribute is an object of key value pairs where key is the attribute value that can be passed to the component
  attributes: {
    size: {
      target: "root",
      options: {
        sm: cva("text-sm"),
        default: cva(""),
        lg: cva("text-lg"),
      },
    },
  },
};

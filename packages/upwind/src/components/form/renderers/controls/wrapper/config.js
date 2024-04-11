import { upwConfig } from "../../../../../utils";

// -----------------------------------------------------------------------------

export default {
  root: upwConfig("relative flex flex-col gap-3"),
  wrapper: {
    root: upwConfig(
      "border-base-300 focus-within:border-primary focus-within:ring-primary  group inline-flex  w-full items-center gap-2 rounded-lg border px-2 py-0 text-sm ring-0 focus-within:ring-4 focus-within:ring-opacity-10"
    ),
    error: upwConfig(
      "border-error-300 focus-within:border-error focus-within:ring-error"
    ),
    success: upwConfig(
      "border-success-300 focus-within:border-success focus-within:ring-success"
    ),
    disabled: upwConfig("bg-base-100 pointer-events-none opacity-50"),
  },
  icon: upwConfig("size-[1.5em]"),
  avatar: upwConfig("size-[1.5em] overflow-hidden rounded-full"),
  status: {
    error: upwConfig("text-error"),
    success: upwConfig("text-success"),
  },
  prefix: {
    root: upwConfig("bg-base-100 -ml-2 rounded-s-lg px-4 py-3"),
    error: upwConfig(""),
    success: upwConfig(""),
  },
  suffix: {
    root: upwConfig("bg-base-100 -mr-2 rounded-e-lg px-4 py-3"),
    error: upwConfig(""),
    success: upwConfig(""),
  },
  label: {
    root: upwConfig(
      "text-base-content flex w-full items-center justify-between gap-2"
    ),
    text: upwConfig(""),
    required: upwConfig("text-base-500 text-sm leading-tight"),
    optional: upwConfig("text-base-500 text-sm leading-tight"),
    error: upwConfig(""),
    success: upwConfig(""),
  },

  feedback: {
    root: upwConfig("flex items-center text-xs"),
    hidden: upwConfig("invisible w-0 overflow-hidden text-nowrap"),
    error: upwConfig("text-error flex items-center gap-2"),
    description: upwConfig("text-base-content flex items-center gap-2"),
    transition: {
      enter: {
        // active: upwConfig("m-0 transition duration-100 ease-out"),
        // from: upwConfig("-translate-y-1 transform opacity-0"),
        // to: upwConfig("translate-y-0 transform opacity-100"),
        active: upwConfig("m-0 transition duration-100 ease-out"),
        from: upwConfig("transform opacity-0"),
        to: upwConfig("transform opacity-100"),
      },
      leave: {
        // active: upwConfig("absolute transition duration-75 ease-in"),
        // from: upwConfig("translate-y-0 transform opacity-100"),
        // to: upwConfig("-translate-y-1 transform opacity-0"),
        active: upwConfig("absolute transition duration-75 ease-in"),
        from: upwConfig("transform opacity-100"),
        to: upwConfig("transform opacity-0"),
      },
    },
  },
};

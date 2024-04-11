import { upwConfig } from "../../../../../utils";

// -----------------------------------------------------------------------------

export default {
  root: upwConfig("relative flex flex-col gap-3 pb-9"),
  wrapper: {
    root: upwConfig(
      "border-base-300 focus-within:border-primary focus-within:ring-primary group inline-flex w-full  items-center gap-2 rounded-lg border px-2 py-0 text-sm ring-0 focus-within:ring-4 focus-within:ring-opacity-10 disabled:pointer-events-none disabled:opacity-50"
    ),
    error: upwConfig(
      "border-error-300 ring-error focus-within:border-error focus-within:ring-error ring-4 ring-opacity-10"
    ),
    success: upwConfig(
      "border-success-300 ring-success focus-within:border-success focus-within:ring-success ring-4 ring-opacity-10"
    ),
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

  error: upwConfig(
    "text-error absolute bottom-0 left-0 right-0 flex items-center gap-2 align-bottom text-xs"
  ),

  description: upwConfig(
    "text-base-content absolute bottom-0 left-0 right-0 flex items-center gap-2 align-bottom text-xs"
  ),
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
};

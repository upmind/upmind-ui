import { upwConfig } from "../../../../../utils";

// -----------------------------------------------------------------------------

export default {
  root: upwConfig("flex flex-col"),
  wrapper: {
    root: upwConfig(
      "form-input border-base-300 focus-within:border-primary focus-within:ring-primary group inline-flex w-full items-center gap-2 rounded-lg p-0 text-sm focus-within:ring-4 focus-within:ring-opacity-10 disabled:pointer-events-none disabled:opacity-50"
    ),
    error: upwConfig("border-error-300 ring-error ring-4 ring-opacity-10"),
    success: upwConfig(
      "border-success-300 ring-success focus-within:border-success focus-within:ring-success ring-4 ring-opacity-10"
    ),
  },
  icon: upwConfig("size-[1.5em]"),
  avatar: upwConfig("size-[1.5em] overflow-hidden rounded-full"),
  prefix: {
    root: upwConfig("bg-base-100 rounded-s-lg px-4 py-3"),
    error: upwConfig(""),
    success: upwConfig(""),
  },
  suffix: {
    root: upwConfig("bg-base-100 rounded-e-lg px-4 py-3"),
    error: upwConfig(""),
    success: upwConfig(""),
  },
  label: {
    root: upwConfig("text-base-content"),
    error: upwConfig(""),
    success: upwConfig(""),
  },
  input: upwConfig("flex-1 bg-transparent px-2 py-3 outline-none"),
  error: upwConfig("text-error mt-2 flex items-center gap-2 text-xs"),
  description: upwConfig("text-base-500 mt-2 flex items-center gap-2 text-xs"),
  status: {
    error: upwConfig("text-error"),
    success: upwConfig("text-success"),
  },
};

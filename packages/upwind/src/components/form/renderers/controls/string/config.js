import { upwConfig } from "../../../../../utils";

// -----------------------------------------------------------------------------

export default {
  root: upwConfig("flex flex-col"),
  wrapper: {
    root: upwConfig(
      "form-input border-base-300 focus-within:border-primary-500 focus-within:ring-primary-500 group inline-flex w-full items-center gap-2 rounded-lg p-0 text-sm disabled:pointer-events-none disabled:opacity-50"
    ),
    error: upwConfig("border-error-300 ring-error ring ring-offset-2"),
    success: upwConfig("border-success-300 ring-success ring ring-offset-2"),
  },
  icon: upwConfig("size-[1.5em]"),
  avatar: upwConfig("size-[1.5em] overflow-hidden rounded-full"),
  prefix: {
    root: upwConfig("bg-base-100 rounded-s-lg px-4 py-3"),
    error: upwConfig(""),
    success: upwConfig(""),
  },
  suffix: {
    root: upwConfig("bg-base-100  rounded-e-lg px-4 py-3"),
    error: upwConfig(""),
    success: upwConfig(""),
  },
  label: {
    root: upwConfig("text-base-content"),
    error: upwConfig(""),
    success: upwConfig(""),
  },
  input: upwConfig("flex-1 bg-transparent px-2 py-3 outline-none"),
  error: upwConfig("text-error mt-1 flex gap-2 text-xs uppercase"),
  description: upwConfig("text-base-500 mt-1 flex gap-2 text-xs uppercase"),
  status: {
    error: upwConfig("text-error"),
    success: upwConfig("text-success"),
  },
};

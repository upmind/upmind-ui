import { upwConfig } from "../../../../../utils";

// -----------------------------------------------------------------------------

export default {
  root: upwConfig("flex flex-col"),
  wrapper: {
    root: upwConfig(
      "form-input border-base-300 focus-within:border-primary-500 focus-within:ring-primary-500 group inline-flex w-full items-stretch rounded-lg p-0 text-sm disabled:pointer-events-none disabled:opacity-50 "
    ),
    error: upwConfig("border-error-300"),
  },
  prefix: {
    root: upwConfig(
      "bg-base-100 group-focus-within:bg-primary-50 rounded-s-lg px-4 py-3"
    ),
    error: upwConfig("bg-error-50"),
  },
  suffix: {
    root: upwConfig(
      "bg-base-100 group-focus-within:bg-primary-50 rounded-e-lg px-4 py-3"
    ),
    error: upwConfig("bg-error-50"),
  },
  label: {
    root: upwConfig("text-base-content"),
    error: upwConfig("text-error"),
  },
  input: upwConfig("flex-1 bg-transparent px-4 py-3 outline-none"),
  error: upwConfig("text-error mt-1 text-xs uppercase"),
  description: upwConfig("text-base-500 mt-1 text-xs uppercase"),
};

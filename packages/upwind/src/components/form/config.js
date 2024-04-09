import { upwConfig } from "../../utils";

// -----------------------------------------------------------------------------

export default {
  root: upwConfig("relative flex w-full flex-col gap-8"),
  loading: upwConfig(
    "absolute bottom-0 left-0 right-0 top-0 m-auto size-6 opacity-80"
  ),
  button: {
    root: upwConfig(
      "bg-base text-base-content border-base-200 hover:bg-base-50 relative flex w-full cursor-pointer items-center gap-x-2 text-nowrap rounded-lg border px-4 py-3 text-start text-sm font-medium shadow-sm before:absolute before:inset-0 before:z-[1] disabled:pointer-events-none disabled:opacity-50"
    ),
    active: upwConfig("ring-primary-500 border-primary-500"),
    label: upwConfig("flex-1 leading-none"),
    icon: upwConfig("size-[1em] transition-all aria-checked:rotate-180"),
  },
  content: {
    root: upwConfig("transition-all duration-300"),
    processing: upwConfig("pointer-events-none opacity-50"),
    loading: upwConfig("invisible opacity-0"),
  },
  actions: {
    root: upwConfig("flex gap-x-2 transition-all duration-300"),
    processing: upwConfig("pointer-events-none opacity-50"),
    loading: upwConfig("invisible opacity-0"),
  },
};

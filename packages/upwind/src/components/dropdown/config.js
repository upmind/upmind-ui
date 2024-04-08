import { upwConfig } from "../../utils";

// -----------------------------------------------------------------------------

export default {
  root: upwConfig("relative inline-flex"),
  button: {
    root: upwConfig(
      "bg-base text-base-800 border-base-200 hover:bg-base-50 inline-flex items-center gap-x-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-sm disabled:pointer-events-none disabled:opacity-50"
    ),
    label: upwConfig("m leading-none"),
    icon: upwConfig("size-[1em] transition-all aria-checked:rotate-180"),
  },
  items: upwConfig(
    "bg-base min-w-60 rounded-lg p-2 shadow-md before:absolute before:-top-4 before:start-0 before:h-4 before:w-full after:absolute after:-bottom-4 after:start-0 after:h-4 after:w-full"
  ),
  group: {
    root: upwConfig(
      "border-base-200 mb-2 w-full border-b pb-2 first:pt-0 last:mb-0 last:border-b-0 last:pb-0"
    ),
    title: {
      root: upwConfig(
        "text-base-500 flex w-full items-center gap-x-3.5 px-3 py-2 text-xs font-medium"
      ),
      label: upwConfig("uppercase"),
      icon: upwConfig("size-[1.5em] flex-shrink-0"),
    },
  },
  item: {
    root: upwConfig(
      "text-base-800 hover:bg-base-100 focus:bg-base-100 flex w-full items-center gap-x-3.5 rounded-lg px-3 py-2 text-sm no-underline focus:outline-none"
    ),
    active: upwConfig("bg-base-200 hover:bg-base-200 focus:bg-base-200"),
    icon: upwConfig("size-[1.5em] flex-shrink-0"),
  },
  transition: {
    enter: {
      active: upwConfig("m-0 transition duration-100 ease-out"),
      from: upwConfig("scale-95 transform opacity-0"),
      to: upwConfig("scale-100 transform opacity-100"),
    },
    leave: {
      active: upwConfig("transition duration-75 ease-in"),
      from: upwConfig("scale-100 transform opacity-100"),
      to: upwConfig("scale-95 transform opacity-0"),
    },
  },
};

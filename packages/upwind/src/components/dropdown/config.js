import { upwConfig } from "../../utils";

// -----------------------------------------------------------------------------

export default {
  root: upwConfig("relative inline-flex"),
  button: {
    root: upwConfig(
      "bg-base text-base-content border-base-200 hover:bg-base-50 relative inline-flex w-full cursor-pointer items-center gap-x-4 text-nowrap rounded-lg border px-4 py-3 text-start text-sm font-medium shadow-sm before:absolute before:inset-0 before:z-[1] disabled:pointer-events-none disabled:opacity-50"
    ),
    active: upwConfig("ring-primary-500 border-primary-500"),
    label: upwConfig("flex-1 leading-none"),
    icon: upwConfig("size-[1em]"),
    toggle: upwConfig("size-[0.75em] transition-all aria-checked:rotate-180"),
  },
  items: upwConfig(
    "bg-base border-base-200 [&::-webkit-scrollbar-thumb]:bg-base-300 [&::-webkit-scrollbar-track]:bg-base-100 z-50 !m-0 max-h-72 min-w-60 space-y-0.5 overflow-hidden overflow-y-auto rounded-lg border p-1 shadow-md [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar]:w-2"
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
      "text-base-800 focus:bg-base-100 flex w-full cursor-pointer items-center justify-start gap-x-4 text-nowrap rounded-lg px-4 py-2 text-left text-sm no-underline focus:outline-none"
    ),
    active: upwConfig("bg-base-100 hover:bg-base-100"),
    selected: upwConfig(
      "bg-base-100 hover:bg-base-100 cursor-default select-none"
    ),
    label: upwConfig("flex-1 truncate"),
    icon: upwConfig("size-[1.25em]"),
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
  // ------------------------------------------------------------
  // Attribute based Classes: These are conditional based on the component props
  // Each Attribute is an object of key value pairs where key is the attribute value that can be passed to the component
  attributes: {
    size: {
      target: "button.root",
      options: {
        default: upwConfig("px-4 py-3 text-sm"),
        sm: upwConfig("px-3 py-2 text-sm"),
        lg: upwConfig("px-5 py-4 text-sm"),
      },
    },
  },
};

import { upwConfig } from "../../utils";

// -----------------------------------------------------------------------------

export default {
  root: upwConfig("relative inline-flex"),
  button: {
    root: upwConfig(
      "bg-base text-base-content border-base-200 hover:bg-base-50 relative inline-flex w-full cursor-pointer items-center gap-x-4 text-nowrap rounded-lg border px-4 py-3 text-start text-sm font-medium shadow-sm before:absolute before:inset-0 before:z-[1] disabled:pointer-events-none disabled:opacity-50 "
    ),
    active: upwConfig("ring-base-500 border-base-500"),
    label: upwConfig("flex-1 truncate leading-none"),
    icon: upwConfig("size-[1em]"),
  },
  items: upwConfig(
    "bg-base border-base-200 [&::-webkit-scrollbar-thumb]:bg-base-300 [&::-webkit-scrollbar-track]:bg-base-100 z-50 mt-2 max-h-72 min-w-full space-y-0.5 overflow-hidden overflow-y-auto rounded-lg  border p-1  [&::-webkit-scrollbar-thumb]:rounded-full  [&::-webkit-scrollbar]:w-2"
  ),

  item: {
    root: upwConfig(
      "text-base-800 focus:bg-base-100 flex w-full cursor-pointer items-center justify-between gap-x-4 text-nowrap rounded-lg  px-4 py-2 text-sm focus:outline-none"
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
};

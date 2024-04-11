import type { Styles } from "./styles";

export const defaultStyles: Styles = {
  control: {
    root: "grid gap-2 w-full",
    inline: "flex justify-start gap-2",
    label: {
      root: "flex place-items-center gap-2",
      text: "text-sm",
    },
    input: "form-input rounded",
    file: "rounded w-full",
    password: "rounded w-full",
    checkbox: "form-checkbox rounded",
    radio: "form-radio",
    select: "form-select rounded w-full",
    textarea: "form-textarea rounded w-full",
    wrapper: "wrapper relative flex items-center",
    option: "option",
    description: "description text-xs mt-2",
    error: {
      text: "text-error text-xs",
      label: "text-error",
      input: "border-error",
      wrapper: "error",
    },
    size: {
      full: "w-full",
      trim: "w-auto",
    },

    lookup: {
      wrapper: "lookup-wrapper",
      item: "lookup-item",
    },
    menu: {
      wrapper: "menu-wrapper",
      item: "menu-item",
    },
    list: {
      wrapper: "list-none p-0",
      item: "",
    },
    rating: {
      wrapper: "flex gap-2",
      item: "form-radio mask-star-2",
      item1: "",
      item2: "",
      item3: "",
      item4: "",
      item5: "",
    },
    dac: {},

    prefix:
      "bg-gray-500 bg-opacity-10 px-4 inline-flex items-center h-full -ml-4",
    suffix:
      "bg-gray-500 bg-opacity-10 px-4 inline-flex items-center h-full -mr-4",
  },
  verticalLayout: {
    root: "vertical-layout flex flex-col gap-10 w-full",
    item: "vertical-layout-item w-full empty:hidden",
  },
  horizontalLayout: {
    root: "horizontal-layout flex flex-wrap gap-10 w-full",
    item: "horizontal-layout-item flex-1",
  },
  group: {
    root: "group",
    label: "group-label divider ",
    item: "group-item",
  },
  arrayList: {
    root: "array-list",
    legend: "array-list-legend",
    addButton: "array-list-add",
    label: "array-list-label",
    itemWrapper: "array-list-item-wrapper",
    noData: "array-list-no-data",
    item: "array-list-item",
    itemToolbar: "array-list-item-toolbar",
    itemLabel: "array-list-item-label",
    itemContent: "array-list-item-content",
    itemExpanded: "expanded",
    itemMoveUp: "array-list-item-move-up",
    itemMoveDown: "array-list-item-move-down",
    itemDelete: "array-list-item-delete",
  },
  label: {
    root: "label-element",
  },
};

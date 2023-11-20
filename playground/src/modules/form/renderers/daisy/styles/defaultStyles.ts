import type { Styles } from "./styles";

export const defaultStyles: Styles = {
  control: {
    root: "form-control w-full",
    inline: "justify-start gap-2",
    label: {
      root: "label",
      text: "label-text"
    },
    input: "input input-bordered w-full",
    checkbox: "checkbox",
    radio: "radio",
    select: "select select-bordered w-full",
    rating: {
      wrapper: "gap-2",
      item: "mask-star",
      item1: "mask-star",
      item2: "mask-star",
      item3: "mask-star",
      item4: "mask-star",
      item5: "mask-star"
    },
    textarea: "textarea textarea-bordered w-full",
    wrapper: "wrapper",
    option: "option",
    description: "description text-xs mt-2",
    error: {
      text: "text-error",
      label: "text-error",
      input: "border-error",
      wrapper: "error"
    }
  },
  verticalLayout: {
    root: "vertical-layout flex flex-col gap-4 w-full",
    item: "vertical-layout-item w-full"
  },
  horizontalLayout: {
    root: "horizontal-layout flex flex-wrap gap-4 w-full",
    item: "horizontal-layout-item flex-1"
  },
  group: {
    root: "group",
    label: "group-label",
    item: "group-item"
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
    itemDelete: "array-list-item-delete"
  },
  label: {
    root: "label-element"
  }
};

// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import { UpwListbox } from "@upmind-automation/upmind-ui";

// --- utils
import { useSystemArgTypes } from "../../utils";
import countries from "../../utils/countries";

// -----------------------------------------------------------------------------

const meta: Meta<typeof UpwListbox> = {
  parameters: {
    controls: {
      exclude: [],
    },
  },
  component: UpwListbox,
  argTypes: {
    size: useSystemArgTypes.size,
    placement: useSystemArgTypes.placement,
    prependAvatar: useSystemArgTypes.flag,
    prependIcon: useSystemArgTypes.icon,
    appendIcon: useSystemArgTypes.icon,
    appendAvatar: useSystemArgTypes.flag,
    toggle: useSystemArgTypes.icon,
    iconSelected: useSystemArgTypes.icon,
  },
  args: {
    label: "Menu of actions",
    size: "md",
    prependText: undefined,
    prependAvatar: undefined,
    prependIcon: undefined,
    appendIcon: undefined,
    appendAvatar: undefined,
    appendText: undefined,
    iconSelected: "check",
    // ---
    multiple: false,
    hasSearch: false,
    counter: undefined,
    toggle: undefined,
    toggleRotate: true,
    placement: "bottom-start",
    items: {
      item1: { value: "item1", label: "Item 1" },
      item2: { value: "item2", label: "Item 2" },
      item3: { value: "item3", label: "Item 3" },
      item4: { value: "item4", label: "Item 4" },
      item5: { value: "item5", label: "Item 5" },
      item6: { value: "item6", label: "Item 6" },
      item7: { value: "item7", label: "Item 7" },
      item8: { value: "item8", label: "Item 8" },
    },
  },
};

export default meta;
type Story = StoryObj<typeof UpwListbox>;

// -----------------------------------------------------------------------------

export const Base: Story = {};

export const Countries: Story = {
  parameters: {
    controls: { exclude: ["label", "items"] },
  },
  args: {
    label: "Select a Country",
    items: countries,
    hasSearch: true,
  },
};

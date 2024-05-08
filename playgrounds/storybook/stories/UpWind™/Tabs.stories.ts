// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import { UpwTabs } from "@upmind/upwind";

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys } from "lodash-es";
// -----------------------------------------------------------------------------

enum alignments {
  start = "start",
  center = "center",
  end = "end",
  between = "between",
  around = "around",
  evenly = "evenly",
}

const meta: Meta<typeof UpwTabs> = {
  parameters: {
    controls: {
      exclude: ["size", "modelValue"],
    },
  },
  component: UpwTabs,
  argTypes: {
    size: useSystemArgTypes.size,
    align: {
      options: keys(alignments),
      control: {
        type: "radio",
        labels: alignments,
      },
      if: { arg: "block", truthy: true },
    },
  },
  args: {
    size: "md",
    disabled: false,
    block: false,
    stretch: false,
    modelValue: "item3",
    align: "start",
    tabs: [
      { id: "item1", label: "Mollit", disabled: true },
      { id: "item2", label: "Lorem ex Lorem" },
      { id: "item3", label: "Veniam aliqua quis" },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof UpwTabs>;

// -----------------------------------------------------------------------------

export const Base: Story = {};

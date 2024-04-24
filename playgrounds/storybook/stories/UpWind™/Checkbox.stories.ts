// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UpwCheckbox, UpwInput } from "@upmind/upwind";

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------

const meta: Meta<typeof UpwCheckbox> = {
  parameters: {
    controls: { exclude: ["layout", "variant"] },
  },
  component: UpwCheckbox,
  subcomponents: { UpwInput },
  argTypes: {
    size: useSystemArgTypes.size,
    // ---
    prependAvatar: useSystemArgTypes.flag,
    prependIcon: useSystemArgTypes.icon,
    // ---
    appendAvatar: useSystemArgTypes.flag,
    appendIcon: useSystemArgTypes.icon,
    // ---
    feedbackIcon: useSystemArgTypes.icon,
    checkedIcon: useSystemArgTypes.icon,
    uncheckedIcon: useSystemArgTypes.icon,
    indeterminateIcon: useSystemArgTypes.icon,
  },
  args: {
    label: "What is your name?",
    description: "Please enter your full name",
    errors: undefined,
    // ---
    modelValue: undefined,
    // ---
    size: "md",
    variant: "outlined",
    layout: "stacked",
    // ---
    prependAvatar: undefined,
    prependIcon: undefined,
    appendIcon: undefined,
    appendAvatar: undefined,
    // ---
    required: false,
    disabled: false,
    visible: true,
    invalid: false,
    forceFocus: false,
  },
};

export default meta;
type Story = StoryObj<typeof UpwCheckbox>;

export const Base: Story = {};

// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { Checkbox, Input } from "@upmind-automation/upwind";

// --- utils
import { useSystemArgTypes } from "../../../utils";

// --- types

// -----------------------------------------------------------------------------

const meta: Meta<typeof Checkbox> = {
  parameters: {
    controls: { exclude: ["layout", "variant", "invalid"] },
  },
  component: Checkbox,
  subcomponents: { Input },
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
    label: "Sign up for our newsletter?",
    description: "We will send you an email once a week with the latest news.",
    errors: undefined,
    // ---
    modelValue: undefined,
    // ---
    size: "md",
    // ---
    prependAvatar: undefined,
    prependIcon: undefined,
    prependText: undefined,
    appendIcon: undefined,
    appendAvatar: undefined,
    appendText: undefined,
    // ---
    required: false,
    disabled: false,
    visible: true,
    invalid: false,
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    components: { Checkbox },
    setup() {
      return {
        args,
      };
    },
    methods: {
      doUpdate(value: boolean) {
        updateArgs({ modelValue: value });
      },
    },
    template: `
        <checkbox v-bind="args" @update:modelValue="doUpdate" />
    `,
  }),
};

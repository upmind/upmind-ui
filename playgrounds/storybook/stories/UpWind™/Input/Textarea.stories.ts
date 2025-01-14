// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { Textarea, Input } from "@upmind-automation/upwind";

// --- utils
import { useSystemArgTypes } from "../../../utils";

// --- types

// -----------------------------------------------------------------------------

const meta: Meta<typeof Textarea> = {
  parameters: {
    controls: { exclude: ["layout", "variant"] },
  },
  component: Textarea,
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
  },
  args: {
    label: "What is your name?",
    description: "Please enter your full name",
    errors: undefined,
    // ---
    modelValue: undefined,
    // ---
    size: "md",
    autosize: false,
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
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    components: { Textarea },
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
        <textarea v-bind="args" @update:modelValue="doUpdate" />
    `,
  }),
};

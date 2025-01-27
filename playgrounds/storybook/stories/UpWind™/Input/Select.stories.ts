// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { Select, Input } from "@upmind-automation/upwind";

// --- utils
import { useSystemArgTypes } from "../../../utils";

// --- types

// -----------------------------------------------------------------------------

const meta: Meta<typeof Select> = {
  parameters: {
    controls: { exclude: ["layout", "variant"] },
  },
  component: Select,
  subcomponents: { Input },
  argTypes: {
    size: useSystemArgTypes.size,
    // ---
    prependAvatar: useSystemArgTypes.flag,
    prependIcon: useSystemArgTypes.icon,
    appendAvatar: useSystemArgTypes.flag,
    appendIcon: useSystemArgTypes.icon,
    feedbackIcon: useSystemArgTypes.icon,
  },
  args: {
    items: [
      {
        value: "1",
        label: "Item 1",
      },
      {
        value: "2",
        label: "Item 2",
      },
      {
        value: "3",
        label: "Item 3",
      },
      {
        value: "4",
        label: "Nisi dolore consectetur.",
      },
      {
        value: "5",
        label: "Incididunt ullamco et elit exercitation ipsum.",
      },
    ],
    label: "What is your name?",
    description: "Please enter your full name",
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
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    components: { Select },
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
        <Select v-bind="args" @update:modelValue="doUpdate" />
    `,
  }),
};

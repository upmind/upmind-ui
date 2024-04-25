// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UpwSelect, UpwInput } from "@upmind/upwind";

// --- utils
import { useSystemArgTypes } from "../../../utils";

// --- types

// -----------------------------------------------------------------------------

const meta: Meta<typeof UpwSelect> = {
  parameters: {
    controls: { exclude: ["layout", "variant"] },
  },
  component: UpwSelect,
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
    invalid: false,
    forceFocus: false,
  },
};

export default meta;
type Story = StoryObj<typeof UpwSelect>;

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    components: { UpwSelect },
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
        <upw-Select v-bind="args" @update:modelValue="doUpdate" />
    `,
  }),
};

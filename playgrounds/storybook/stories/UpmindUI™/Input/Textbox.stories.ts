// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UpwTextbox, UpwInput } from "@upmind-automation/upmind-ui";

// --- utils
import { useSystemArgTypes } from "../../../utils";

// --- types

// -----------------------------------------------------------------------------

const meta: Meta<typeof UpwTextbox> = {
  parameters: {
    controls: { exclude: ["layout", "variant"] },
  },
  component: UpwTextbox,
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
type Story = StoryObj<typeof UpwTextbox>;

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    components: { UpwTextbox },
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
        <upw-textbox v-bind="args" @update:modelValue="doUpdate" />
    `,
  }),
};

// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UpwTextarea, UpwInput } from "@upmind/upwind";

// --- utils
import { useSystemArgTypes } from "../../../utils";

// --- types

// -----------------------------------------------------------------------------

const meta: Meta<typeof UpwTextarea> = {
  parameters: {
    controls: { exclude: ["layout", "variant"] },
  },
  component: UpwTextarea,
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
type Story = StoryObj<typeof UpwTextarea>;

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    components: { UpwTextarea },
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
        <upw-textarea v-bind="args" @update:modelValue="doUpdate" />
    `,
  }),
};

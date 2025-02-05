// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UpwRadio, UpwInput } from "@upmind-automation/upmind-ui";

// --- utils
import { useSystemArgTypes } from "../../../utils";

// --- types

// -----------------------------------------------------------------------------

const meta: Meta<typeof UpwRadio> = {
  parameters: {
    controls: { exclude: ["layout", "variant", "invalid"] },
  },
  component: UpwRadio,
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
  },
};

export default meta;
type Story = StoryObj<typeof UpwRadio>;

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    components: { UpwRadio },
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
        <upw-radio v-bind="args" @update:modelValue="doUpdate" :value="true" />
    `,
  }),
};

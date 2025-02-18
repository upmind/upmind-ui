// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UpwCheckboxList, UpwInput } from "@upmind-automation/upmind-ui";

// --- utils
import { useSystemArgTypes } from "../../../utils";
import { compact, uniq } from "lodash-es";
// --- types

// -----------------------------------------------------------------------------

const meta: Meta<typeof UpwCheckboxList> = {
  parameters: {
    controls: { exclude: ["layout", "variant", "invalid"] },
  },
  component: UpwCheckboxList,
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
type Story = StoryObj<typeof UpwCheckboxList>;

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    components: { UpwCheckboxList },
    setup() {
      // NB: ensure we start with a nice clean array
      updateArgs({ modelValue: uniq(compact(args.modelValue)) });

      return {
        args,
      };
    },
    methods: {
      doUpdate(values: Array<any>) {
        updateArgs({ modelValue: values });
      },
    },
    template: `
        <upm-checkbox-list v-bind="args" @update:modelValue="doUpdate" :value="true" />
    `,
  }),
};

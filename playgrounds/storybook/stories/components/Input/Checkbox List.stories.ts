// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import {
  CheckboxCards,
  type CheckboxCardsItemProps,
} from "@upmind-automation/upmind-ui";

// --- utils
import { useSystemArgTypes } from "../../../utils";
import { compact, uniq } from "lodash-es";
// --- types

// -----------------------------------------------------------------------------

const meta: Meta<typeof CheckboxCards> = {
  parameters: {
    controls: { exclude: ["layout", "variant", "invalid"] },
  },
  component: CheckboxCards,
  argTypes: {},
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
    ] as CheckboxCardsItemProps[],
  },
};

export default meta;
type Story = StoryObj<typeof CheckboxCards>;

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    components: { CheckboxCards },
    setup() {
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
        <CheckboxCards v-bind="args" />
    `,
  }),
};

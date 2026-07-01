// --- external

// -- components
import {
  RadioCards,
  type RadioCardsItemProps
} from "@upmind-automation/upmind-ui";
import type { Meta, StoryObj } from "@storybook/vue3";

// --- types

// -----------------------------------------------------------------------------

const meta: Meta<typeof RadioCards> = {
  parameters: {
    controls: { exclude: ["layout", "variant", "invalid"] },
    docs: {
      description: {
        component:
          "A list-style control that allows users to select a single option from multiple choices."
      }
    }
  },
  component: RadioCards,
  argTypes: {},
  args: {
    items: [
      {
        value: "1",
        label: "Item 1"
      },
      {
        value: "2",
        label: "Item 2"
      },
      {
        value: "3",
        label: "Item 3"
      },
      {
        value: "4",
        label: "Nisi dolore consectetur."
      },
      {
        value: "5",
        label: "Incididunt ullamco et elit exercitation ipsum."
      }
    ] as RadioCardsItemProps[]
  }
};

export default meta;
type Story = StoryObj<typeof RadioCards>;

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    components: { RadioCards },
    setup() {
      return {
        args
      };
    },
    methods: {
      doUpdate(value: boolean) {
        updateArgs({ modelValue: value });
      }
    },
    template: `
        <RadioCards v-bind="args" />
    `
  })
};

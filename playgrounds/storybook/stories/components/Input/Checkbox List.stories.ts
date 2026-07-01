// --- external

// -- components
import {
  CheckboxCards,
  type CheckboxCardsItemProps
} from "@upmind-automation/upmind-ui";
import type { Meta, StoryObj } from "@storybook/vue3";
// --- types

// -----------------------------------------------------------------------------

const meta: Meta<typeof CheckboxCards> = {
  parameters: {
    controls: { exclude: ["layout", "variant", "invalid"] }
  },
  component: CheckboxCards,
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
    ] as CheckboxCardsItemProps[]
  }
};

export default meta;
type Story = StoryObj<typeof CheckboxCards>;

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    components: { CheckboxCards },
    setup() {
      return {
        args
      };
    },
    methods: {
      doUpdate(values: Array<any>) {
        updateArgs({ modelValue: values });
      }
    },
    template: `
        <CheckboxCards v-bind="args" />
    `
  })
};

export const States: Story = {
  parameters: {
    controls: { exclude: ["modelValue"] }
  },
  argTypes: {
    label: { control: "text" }
  },
  args: {
    label: "Left label"
  },
  render: (args: any) => ({
    components: { CheckboxCards },
    setup() {
      const items = [
        {
          index: 1,
          value: "1",
          label: args.label
        }
      ];

      return {
        items
      };
    },
    template: `
    <section class="flex flex-col gap-4 max-w-xl">
      <div>
        <h3 class="text-sm-loose text-muted">Normal</h3>
        <CheckboxCards
          :items="items"
        />
      </div>

      <div>
        <h3 class="text-sm-loose text-muted">Hover</h3>
        <CheckboxCards
          :items="items"
          data-hover="true"
        />
      </div>

      <div>
        <h3 class="text-sm-loose text-muted">Focused</h3>
        <CheckboxCards
        :items="items"
        data-focus="true"
      />
      </div>

      <div>
        <h3 class="text-sm-loose text-muted">Selected</h3>
        <CheckboxCards
          :model-value="['1']"
          :items="items"
        />
      </div>
    </section>
    `
  })
};

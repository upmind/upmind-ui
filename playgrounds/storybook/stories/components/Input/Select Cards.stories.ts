import { ref } from "vue";
import {
  SelectCards,
  type SelectCardsItemProps
} from "@upmind-automation/upmind-ui";
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components

// --- utils

const meta: Meta<typeof SelectCards> = {
  component: SelectCards,
  argTypes: {},
  args: {
    items: [
      {
        id: "1",
        label: "1 Month",
        appendLabel: "$20.99/mo"
      },
      {
        id: "2",
        label: "6 Months",
        appendLabel: "$19.99/mo"
      },
      {
        id: "3",
        label: "1 Year",
        appendLabel: "$14.99/mo"
      },
      {
        id: "4",
        label: "2 Years",
        appendLabel: "$9.99/mo"
      }
    ] as SelectCardsItemProps[],
    width: "auto"
  },
  parameters: {
    docs: {
      description: {
        component:
          "A card-based selection control that allows users to choose from a set of predefined options with enhanced visual presentation."
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof SelectCards>;

export const Base: Story = {
  parameters: {
    controls: { exclude: ["modelValue"] }
  }
};

export const States: Story = {
  parameters: {
    controls: { exclude: ["modelValue"] }
  },
  render: (args: any) => ({
    components: { SelectCards },
    setup() {
      const modelValue = ref(args.modelValue);
      const width = "full";
      const products = [] as {
        id: string;
        label: string;
        appendLabel: string;
      }[];

      return {
        args,
        modelValue,
        products,
        width
      };
    },
    template: `
      <section class="flex flex-col gap-4 max-w-sm">
        <div>
          <h3 class="text-sm-loose text-muted">Default</h3>
          <SelectCards
            :items="args.items"
            :width="width"
          />
        </div>

        <div>
          <h3 class="text-sm-loose text-muted">Hover</h3>
          <SelectCards
            :items="args.items"
            :width="width"
            data-hover="true"
          />
        </div>

        <div>
          <h3 class="text-sm-loose text-muted">Focused</h3>
          <SelectCards
            :items="args.items"
            :width="width"
            data-focus="true"
          />
        </div>

        <div>
          <h3 class="text-sm-loose text-muted">Selected</h3>
          <SelectCards
            :model-value="'1'"
            :items="args.items"
            :width="width"
          />
        </div>
      </section>
    `
  })
};

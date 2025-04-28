// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import {
  SelectCards,
  type SelectCardsItemProps,
} from "@upmind-automation/upmind-ui";

// --- utils
import { find } from "lodash-es";
import { ref } from "vue";

const meta: Meta<typeof SelectCards> = {
  component: SelectCards,
  argTypes: {},
  args: {
    items: [
      { id: "1", value: "1" },
      { id: "2", value: "2" },
      { id: "3", value: "3" },
      { id: "4", value: "4" },
    ] as SelectCardsItemProps[],
    modelValue: "1",
    width: "2xl",
  },
  parameters: {
    docs: {
      description: {
        component:
          "A card-based selection control that allows users to choose from a set of predefined options with enhanced visual presentation.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SelectCards>;

export const Base: Story = {
  parameters: {
    controls: { exclude: ["modelValue"] },
  },
  render: (args: any) => ({
    components: { SelectCards },
    setup() {
      const modelValue = ref(args.modelValue);
      const products = [
        {
          id: "1",
          name: "1 Month",
          price: "$20.99/mo",
        },
        {
          id: "2",
          name: "6 Months",
          price: "$19.99/mo",
        },
        {
          id: "3",
          name: "1 Year",
          price: "$14.99/mo",
        },
        {
          id: "4",
          name: "2 Years",
          price: "$9.99/mo",
        },
      ] as { id: string; name: string; description: string; price: string }[];

      const getProduct = (id: string) => {
        return find(products, { id });
      };

      return {
        args,
        modelValue,
        products,
        getProduct,
      };
    },
    template: `
      <SelectCards
        v-model="modelValue"
        :items="args.items"
        :width="args.width"
      >
        <template #item="{ item, index }">
          <div class="flex items-center justify-between w-full">
            <h3 class="m-0 font-medium text-sm">
              {{ getProduct(item.id)?.name }}
            </h3>

          <i class="opacity-50 text-sm">
            {{ getProduct(item.id)?.price }}
          </i>
          </div>
        </template>
        <template #dropdown-item="{ item, index }">
          <div class="flex items-center justify-between w-full">
            <h3 class="m-0 font-medium text-sm">
              {{ getProduct(item.id)?.name }}
            </h3>

          <i class="opacity-50 text-sm">
            {{ getProduct(item.id)?.price }}
          </i>
          </div>
        </template>
      </SelectCards>
    `,
  }),
};

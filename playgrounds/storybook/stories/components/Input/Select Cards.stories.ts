// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import {
  SelectCards,
  type SelectCardsItemProps
} from "@upmind-automation/upmind-ui";

// --- utils
import { find } from "lodash-es";
import { ref } from "vue";

const meta: Meta<typeof SelectCards> = {
  component: SelectCards,
  argTypes: {},
  args: {
    items: [
      { label: "item #1", value: "1", item: { id: "1" } },
      { label: "item #2", value: "2", item: { id: "2" } },
      { label: "item #3", value: "3", item: { id: "3" } },
      { label: "item #4", value: "4", item: { id: "4" } }
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
  },
  render: (args: any) => ({
    components: { SelectCards },
    setup() {
      const modelValue = null;
      const products = [
        {
          id: "1",
          name: "1 Month",
          price: "$20.99/mo"
        },
        {
          id: "2",
          name: "6 Months",
          price: "$19.99/mo"
        },
        {
          id: "3",
          name: "1 Year",
          price: "$14.99/mo"
        },
        {
          id: "4",
          name: "2 Years",
          price: "$9.99/mo"
        }
      ] as { id: string; name: string; description: string; price: string }[];

      const getProduct = (id: string) => {
        return find(products, { id });
      };

      return {
        args,
        modelValue,
        products,
        getProduct
      };
    },
    template: `
      <SelectCards
        v-model="modelValue"
        :items="args.items"
        :width="args.width"
      >
        <template #item="{ item, index }">
          <div class="flex items-center gap-4 whitespace-nowrap">
            <h3 class="m-0 font-medium text-sm">
              {{ getProduct(item.id)?.name }}
            </h3>

          <i class="opacity-50 text-sm">
            {{ getProduct(item.id)?.price }}
          </i>
          </div>
        </template>
        <template #dropdown-item="{ item, index }">
          <div class="flex items-center gap-4 whitespace-nowrap">
            <h3 class="m-0 font-medium text-sm">
              {{ getProduct(item.id)?.name }}
            </h3>

          <i class="opacity-50 text-sm">
            {{ getProduct(item.id)?.price }}
          </i>
          </div>
        </template>
      </SelectCards>
    `
  })
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
      const products = [
        {
          id: "1",
          name: "1 Month",
          price: "$20.99/mo"
        },
        {
          id: "2",
          name: "6 Months",
          price: "$19.99/mo"
        },
        {
          id: "3",
          name: "1 Year",
          price: "$14.99/mo"
        },
        {
          id: "4",
          name: "2 Years",
          price: "$9.99/mo"
        }
      ] as { id: string; name: string; description: string; price: string }[];

      const getProduct = (id: string) => {
        return find(products, { id });
      };

      return {
        args,
        modelValue,
        products,
        getProduct,
        width
      };
    },
    template: `
      <section class="flex flex-col gap-4 max-w-sm">
        <div>
          <h3 class="text-sm/loose text-muted">Default</h3>
          <SelectCards
            :items="args.items"
            :width="width"
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
        </div>

        <div>
          <h3 class="text-sm/loose text-muted">Hover</h3>
          <SelectCards
            :items="args.items"
            :width="width"
            data-hover="true"
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
        </div>

        <div>
          <h3 class="text-sm/loose text-muted">Focused</h3>
          <SelectCards
            :items="args.items"
            :width="width"
            data-focus="true"
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
        </div>

        <div>
          <h3 class="text-sm/loose text-muted">Selected</h3>
          <SelectCards
            :model-value="'1'"
            :items="args.items"
            :width="width"
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
        </div>
      </section>
    `
  })
};

// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import {
  RadioCards,
  type RadioCardsItemProps,
} from "@upmind-automation/upmind-ui";

// --- utils
import { find } from "lodash-es";
import { ref } from "vue";

const meta: Meta<typeof RadioCards> = {
  component: RadioCards,
  argTypes: {},
  args: {
    items: [
      {
        index: 1,
        value: "1",
        item: {
          id: "1",
          name: "Adobe Photoshop",
          description:
            "Industry-standard photo editing and graphic design software",
          price: "$20.99/mo",
        },
      },
      {
        index: 2,
        value: "2",
        item: {
          id: "2",
          name: "Adobe Photoshop",
          description:
            "Industry-standard photo editing and graphic design software",
          price: "$20.99/mo",
        },
      },
      {
        index: 3,
        value: "3",
        item: {
          id: "3",
          name: "Sketch",
          description:
            "Professional UI/UX design tool for Mac with powerful collaboration features",
          price: "$9.99/mo",
        },
      },
      {
        index: 4,
        value: "4",
        item: {
          id: "4",
          name: "GitHub Enterprise",
          description:
            "Self-hosted version control platform with advanced security features",
          price: "$21.99/mo",
        },
      },
    ] as RadioCardsItemProps[],
    modelValue: "",
  },
  parameters: {
    docs: {
      description: {
        component:
          "A card-based radio input that allows users to select a single option from a visually enhanced set.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RadioCards>;

export const Base: Story = {
  parameters: {
    controls: { exclude: ["modelValue"] },
  },
  render: (args: any) => ({
    components: { RadioCards },
    setup() {
      const modelValue = ref(args.modelValue);
      const getProduct = (value: string) => {
        const foundRadioItem = find(args.items, { value: value });
        return foundRadioItem?.item;
      };

      return {
        args,
        modelValue,
        getProduct,
      };
    },
    template: `
      <RadioCards
        v-model="modelValue"
        :items="args.items"
      >
        <template #item="{ item, index }">
          <div class="flex justify-between w-full">
          <div class="flex flex-col gap-y-1">
            <h3 class="m-0 text-base leading-none font-medium">
              {{ getProduct(item.id)?.name }}
            </h3>
            <p class="m-0 text-sm opacity-50">
              {{ getProduct(item.id)?.description }}
            </p>
          </div>

          <i class="text-sm font-bold">
            {{ getProduct(item.id)?.price }}
          </i>
          </div>
        </template>
      </RadioCards>
    `,
  }),
};

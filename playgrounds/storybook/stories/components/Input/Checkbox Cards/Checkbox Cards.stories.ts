// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import {
  CheckboxCards,
  type CheckboxCardsItemProps,
} from "@upmind-automation/upmind-ui";

// --- utils
import { find } from "lodash-es";
import { ref } from "vue";

const meta: Meta<typeof CheckboxCards> = {
  component: CheckboxCards,
  argTypes: {
    cursor: {
      options: ["pointer", "default"],
      control: { type: "select" },
    },
  },
  args: {
    items: [
      { id: "1", value: "1" },
      { id: "2", value: "2" },
      { id: "3", value: "3" },
      { id: "4", value: "4" },
    ] as CheckboxCardsItemProps[],
    modelValue: [],
  },
  parameters: {
    docs: {
      description: {
        component:
          "A card-based checkbox input that allows users to select multiple options with enhanced visual presentation.",
      },
      story: {
        iframeHeight: 400,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CheckboxCards>;

export const Base: Story = {
  parameters: {
    controls: { exclude: ["uiConfig"] },
  },
  render: (args: any) => ({
    components: { CheckboxCards },
    setup() {
      const modelValue = ref(args.modelValue);
      const products = [
        {
          id: "1",
          name: "Adobe Photoshop",
          description:
            "Industry-standard photo editing and graphic design software",
          price: "$20.99/mo",
        },
        {
          id: "2",
          name: "JetBrains IntelliJ IDEA",
          description:
            "Professional Java IDE with advanced code assistance and frameworks support",
          price: "$19.99/mo",
        },
        {
          id: "3",
          name: "Sketch",
          description:
            "Professional UI/UX design tool for Mac with powerful collaboration features",
          price: "$9.99/mo",
        },
        {
          id: "4",
          name: "GitHub Enterprise",
          description:
            "Self-hosted version control platform with advanced security features",
          price: "$21.99/mo",
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
      <CheckboxCards
        v-model="modelValue"
        :items="args.items"
      >
        <template #item="{ item, index }">
          <div class="flex justify-between">
          <div class="flex flex-col gap-y-1">
            <h3 class="m-0 text-base leading-none font-medium">
              {{ getProduct(item.id)?.name }}
            </h3>
            <p class="m-0 text-sm opacity-50 font-normal">
              {{ getProduct(item.id)?.description }}
            </p>
          </div>

          <i class="text-sm font-bold">
            {{ getProduct(item.id)?.price }}
          </i>
          </div>
        </template>
      </CheckboxCards>
    `,
  }),
};

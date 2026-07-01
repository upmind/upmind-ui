import { ref } from "vue";
import {
  CheckboxCards,
  type CheckboxCardsItemProps
} from "@upmind-automation/upmind-ui";
import { BADGE_VARIANTS, BADGE_COLORS } from "@upmind-automation/upmind-ui";
import { find } from "lodash-es";
import type { Meta, StoryObj } from "@storybook/vue3";

const meta: Meta<typeof CheckboxCards> = {
  component: CheckboxCards,
  argTypes: {
    cursor: {
      options: ["pointer", "default"],
      control: { type: "select" }
    }
  },
  args: {
    items: [
      { id: "1", value: "1" },
      { id: "2", value: "2" },
      { id: "3", value: "3" },
      { id: "4", value: "4" }
    ] as CheckboxCardsItemProps[],
    modelValue: []
  },
  parameters: {
    docs: {
      description: {
        component:
          "A card-based checkbox input that allows users to select multiple options with enhanced visual presentation."
      },
      story: {
        iframeHeight: 400
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof CheckboxCards>;

export const Base: Story = {
  parameters: {
    controls: { exclude: ["uiConfig"] }
  },
  render: (args: any) => ({
    components: { CheckboxCards },
    setup() {
      const modelValue = ref(args.modelValue);
      const items = [
        {
          index: 1,
          value: "1",
          label: "VPS Basic",
          secondaryLabel: "$12.99/mo",
          description: "1 vCPU, 1GB RAM, 50GB SSD",
          secondaryDescription:
            "Perfect for small websites and development projects",
          badge: {
            variant: "solid",
            color: "promo",
            label: "Standard"
          },
          secondaryBadge: {
            variant: "muted",
            color: "promo",
            label: "Save 35%"
          },
          action: "Select Plan"
        },
        {
          index: 2,
          value: "2",
          label: "VPS Pro",
          secondaryLabel: "$29.99/mo",
          description: "2 vCPU, 4GB RAM, 100GB SSD",
          secondaryDescription:
            "Ideal for growing businesses and e-commerce sites",
          badge: {
            variant: "solid",
            color: "promo",
            label: "Premium"
          },
          secondaryBadge: {
            variant: "muted",
            color: "promo",
            label: "Save 40%"
          },
          action: "Select Plan"
        },
        {
          index: 3,
          value: "3",
          label: "Dedicated Server",
          secondaryLabel: "$149.99/mo",
          description: "8 vCPU, 16GB RAM, 500GB SSD",
          secondaryDescription:
            "High-performance hosting for demanding applications",
          badge: {
            variant: "solid",
            color: "primary",
            label: "Business"
          },
          secondaryBadge: {
            variant: "muted",
            color: "promo",
            label: "Save 25%"
          },
          action: "Select Plan"
        },
        {
          index: 4,
          value: "4",
          label: "Enterprise Cloud",
          secondaryLabel: "$299.99/mo",
          description: "16 vCPU, 32GB RAM, 1TB SSD",
          secondaryDescription:
            "Scalable cloud infrastructure for enterprise applications",
          badge: {
            variant: "solid",
            color: "primary",
            label: "Enterprise"
          },
          secondaryBadge: {
            variant: "muted",
            color: "promo",
            label: "Save 50%"
          },
          action: "Select Plan"
        }
      ] as CheckboxCardsItemProps[];

      const getProduct = (id: string) => {
        return find(items, { id });
      };

      return {
        args,
        modelValue,
        items,
        getProduct
      };
    },
    template: `
      <CheckboxCards
        v-model="modelValue"
        :items="items"
      />
    `
  })
};

export const States: Story = {
  parameters: {
    controls: { exclude: ["modelValue"] }
  },
  argTypes: {
    label: { control: "text" },
    secondaryLabel: { control: "text" },
    description: { control: "text" },
    secondaryDescription: { control: "text" },
    badgeVariant: {
      control: "select",
      options: BADGE_VARIANTS
    },
    badgeColor: {
      control: "select",
      options: BADGE_COLORS
    },
    badgeLabel: { control: "text" },
    secondaryBadgeVariant: {
      control: "select",
      options: BADGE_VARIANTS
    },
    secondaryBadgeColor: {
      control: "select",
      options: BADGE_COLORS
    },
    secondaryBadgeLabel: { control: "text" },
    action: { control: "text" }
  },
  args: {
    label: "Left label",
    secondaryLabel: "Test",
    description: "Content for sub-row A",
    secondaryDescription: "Content for sub-row B",
    badgeVariant: "solid",
    badgeColor: "promo",
    badgeLabel: "Default",
    secondaryBadgeVariant: "muted",
    secondaryBadgeColor: "promo",
    secondaryBadgeLabel: "Default",
    action: "Edit"
  },
  render: (args: any) => ({
    components: { CheckboxCards },
    setup() {
      const items = [
        {
          index: 1,
          value: "1",
          label: args.label,
          secondaryLabel: args.secondaryLabel,
          description: args.description,
          secondaryDescription: args.secondaryDescription,
          badge: {
            variant: args.badgeVariant,
            color: args.badgeColor,
            label: args.badgeLabel
          },
          secondaryBadge: {
            variant: args.secondaryBadgeVariant,
            color: args.secondaryBadgeColor,
            label: args.secondaryBadgeLabel
          },
          action: args.action
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

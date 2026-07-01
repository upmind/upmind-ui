// --- external

// -- components
import {
  RadioCards,
  type RadioCardsItemProps
} from "@upmind-automation/upmind-ui";
import { BADGE_VARIANTS, BADGE_COLORS } from "@upmind-automation/upmind-ui";
import type { Meta, StoryObj } from "@storybook/vue3";

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
          price: "$20.99/mo"
        }
      },
      {
        index: 2,
        value: "2",
        item: {
          id: "2",
          name: "Adobe Photoshop",
          description:
            "Industry-standard photo editing and graphic design software",
          price: "$20.99/mo"
        }
      },
      {
        index: 3,
        value: "3",
        item: {
          id: "3",
          name: "Sketch",
          description:
            "Professional UI/UX design tool for Mac with powerful collaboration features",
          price: "$9.99/mo"
        }
      },
      {
        index: 4,
        value: "4",
        item: {
          id: "4",
          name: "GitHub Enterprise",
          description:
            "Self-hosted version control platform with advanced security features",
          price: "$21.99/mo"
        }
      }
    ] as RadioCardsItemProps[],
    modelValue: ""
  },
  parameters: {
    docs: {
      description: {
        component:
          "A card-based radio input that allows users to select a single option from a visually enhanced set."
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof RadioCards>;

export const Base: Story = {
  parameters: {
    controls: { exclude: ["modelValue"] }
  },
  argTypes: {
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
    badgeVariant: "solid",
    badgeColor: "promo",
    badgeLabel: "Default",
    secondaryBadgeVariant: "muted",
    secondaryBadgeColor: "promo",
    secondaryBadgeLabel: "Default",
    action: "Details"
  },
  render: (_args: any) => ({
    components: { RadioCards },
    setup() {
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
      ] as RadioCardsItemProps[];

      return {
        items
      };
    },
    template: `
            <RadioCards
            class="max-w-3xl"
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
    components: { RadioCards },
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
        <RadioCards
          :items="items"
        />
      </div>

      <div>
        <h3 class="text-sm-loose text-muted">Hover</h3>
        <RadioCards
          :items="items"
          data-hover="true"
        />
      </div>

      <div>
        <h3 class="text-sm-loose text-muted">Focused</h3>
        <RadioCards
        :items="items"
        data-focus="true"
      />
      </div>

      <div>
        <h3 class="text-sm-loose text-muted">Selected</h3>
        <RadioCards
          model-value="1"
          :items="items"
        />
      </div>
    </section>
    `
  })
};

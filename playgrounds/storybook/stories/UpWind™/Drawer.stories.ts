// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UwDrawer, UwButton, useCustomElement } from "@upmind/upwind";
useCustomElement(UwDrawer);
useCustomElement(UwButton);

// -----------------------------------------------------------------------------

const meta: Meta<typeof UwDrawer> = {
  args: {
    title: "Are you absolutely sure?",
    description: "This action cannot be undone.",
  },
};

export default meta;
type Story = StoryObj<typeof UwDrawer>;

export const Base: Story = {
  render: args => ({
    setup() {
      return {
        args,
      };
    },
    template: `
      <uw-drawer v-bind="args">
        <uw-button slot="trigger">Open Dialog</uw-button>
        <div slot="close">
        <uw-button block>Close</uw-button>
        </div>
      </uw-drawer>
    `,
  }),
};

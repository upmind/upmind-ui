// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UwDrawer, UwButton } from "@upmind/upwind";

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys } from "lodash-es";
// -----------------------------------------------------------------------------

const meta: Meta<typeof UwDrawer> = {
  component: UwDrawer,
  args: {
    title: "Are you absolutely sure?",
    description: "This action cannot be undone.",
  },
};

export default meta;
type Story = StoryObj<typeof UwDrawer>;

export const Base: Story = {
  render: args => ({
    components: { UwDrawer, UwButton },
    setup() {
      return {
        args,
      };
    },
    template: `
      <uw-drawer v-bind="args">
        <template v-slot:trigger>
          <uw-button>Open Drawer</uw-button>
        </template>

        <template v-slot:close>
          <uw-button label="Close" />
        </template>
      </uw-drawer>
    `,
  }),
};

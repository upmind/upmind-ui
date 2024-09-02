// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import { VApp } from "@velia/velia";
// -----------------------------------------------------------------------------

const meta: Meta<typeof VApp> = {
  component: VApp,
};

export default meta;
type Story = StoryObj<typeof VApp>;

export const Base = () => ({
  components: { VApp },
  template: `
    <v-app>
      <div>Content</div>
    </v-app>
  `,
});

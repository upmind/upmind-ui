// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import { VFooter } from "@velia/velia";
// -----------------------------------------------------------------------------

const meta: Meta<typeof VFooter> = {
  component: VFooter,
};

export default meta;
type Story = StoryObj<typeof VFooter>;

// -----------------------------------------------------------------------------

export const Base: Story = {};

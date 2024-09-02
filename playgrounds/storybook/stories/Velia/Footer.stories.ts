// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import { VHeader } from "@velia/velia";
// -----------------------------------------------------------------------------

const meta: Meta<typeof VHeader> = {
  component: VHeader,
};

export default meta;
type Story = StoryObj<typeof VHeader>;

// -----------------------------------------------------------------------------

export const Base: Story = {};

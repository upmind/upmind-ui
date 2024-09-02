// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import { Header } from "@velia/velia";
// -----------------------------------------------------------------------------

const meta: Meta<typeof Header> = {
  component: Header,
};

export default meta;
type Story = StoryObj<typeof Header>;

// -----------------------------------------------------------------------------

export const Base: Story = {};

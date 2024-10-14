// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UpwAvatar } from "@upmind-automation/upwind";

// --- utils
import { useSystemArgTypes } from "../../utils";

// --- types

// -----------------------------------------------------------------------------

const meta: Meta<typeof UpwAvatar> = {
  component: UpwAvatar,
  argTypes: {
    avatar: useSystemArgTypes.flag,
    size: useSystemArgTypes.allSizes,
  },
  args: {
    avatar: { caption: "DC" },
    size: "lg",
  },
};

export default meta;
type Story = StoryObj<typeof UpwAvatar>;

export const Base: Story = {};

export const Flag: Story = {
  args: {
    avatar: { name: "gb", path: "flags" },
    size: "lg",
  },
};

export const Gravatar: Story = {
  args: {
    avatar: {
      src: "https://www.gravatar.com/avatar/4289a4e6163b9adc987168444774435b?d=404&s=200",
    },
    size: "lg",
  },
};

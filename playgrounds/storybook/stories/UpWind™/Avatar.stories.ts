// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UpwAvatar, AvatarImage } from "@upmind/upwind";

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys } from "lodash-es";

// -----------------------------------------------------------------------------
enum shapes {
  circle = "Circle",
  square = "Square",
}

const meta: Meta<typeof UpwAvatar> = {
  component: UpwAvatar,
  argTypes: {
    avatar: useSystemArgTypes.flag,
    size: useSystemArgTypes.baseSizes,
    shape: {
      options: keys(shapes),
      control: {
        type: "radio",
        labels: shapes,
      },
    },
  },
  args: {
    avatar: { caption: "DC" },
    size: "base",
    shape: "circle",
  },
};

export default meta;
type Story = StoryObj<typeof UpwAvatar>;

export const Base: Story = {};

export const Flag: Story = {
  args: {
    avatar: { name: "gb", path: "flags" },
    size: "base",
  },
};

export const Gravatar: Story = {
  args: {
    avatar: {
      src: "https://www.gravatar.com/avatar/4289a4e6163b9adc987168444774435b?d=404&s=200",
    },
    size: "base",
  },
};

export const SlotContent: Story = {
  parameters: {
    controls: { exclude: ["avatar"] },
  },
  render: args => ({
    components: { UpwAvatar, AvatarImage },
    setup() {
      return {
        args,
      };
    },
    template: `
      <div class="flex space-x-4">
        <UpwAvatar v-bind="args" :avatar="null">
          Slot
        </UpwAvatar>

        <UpwAvatar v-bind="args" :avatar="null">
          <AvatarImage src="https://www.gravatar.com/avatar/4289a4e6163b9adc987168444774435b?d=404&s=200" />
        </UpwAvatar>
      </div>
    `,
  }),
};

export const GravatarWithText: Story = {
  args: {
    avatar: {
      caption: "DC",
      src: "https://www.gravatar.com/avatar/98302662b1abcc4cfe17b1205cb53255?d=blank&s=200",
    },
    size: "base",
  },
};

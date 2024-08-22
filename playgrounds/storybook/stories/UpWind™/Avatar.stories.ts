// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UwAvatar, useCustomElement } from "@upmind/upwind";
useCustomElement(UwAvatar);

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys } from "lodash-es";

// -----------------------------------------------------------------------------
enum shapes {
  circle = "Circle",
  square = "Square",
}

const meta: Meta<typeof UwAvatar> = {
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
    size: "md",
    shape: "circle",
  },
};

export default meta;
type Story = StoryObj<typeof UwAvatar>;

export const Base: Story = {};

export const Flag: Story = {
  args: {
    avatar: { name: "gb", path: "flags" },
    size: "md",
  },
};

export const Gravatar: Story = {
  args: {
    avatar: {
      src: "https://www.gravatar.com/avatar/4289a4e6163b9adc987168444774435b?d=404&s=200",
    },
    size: "md",
  },
};

// export const SlotContent: Story = {
//   parameters: {
//     controls: { exclude: ["avatar"] },
//   },
//   render: args => ({
//     components: { AvatarImage },
//     setup() {
//       return {
//         args,
//       };
//     },
//     template: `
//       <div class="flex space-x-4">
//         <UwAvatar v-bind="args" :avatar="null">
//           Slot
//         </UwAvatar>

//         <UwAvatar v-bind="args" :avatar="null">
//           <AvatarImage src="https://www.gravatar.com/avatar/4289a4e6163b9adc987168444774435b?d=404&s=200" />
//         </UwAvatar>
//       </div>
//     `,
//   }),
// };

export const GravatarWithText: Story = {
  args: {
    avatar: {
      caption: "DC",
      src: "https://www.gravatar.com/avatar/98302662b1abcc4cfe17b1205cb53255?d=blank&s=200",
    },
    size: "md",
  },
};

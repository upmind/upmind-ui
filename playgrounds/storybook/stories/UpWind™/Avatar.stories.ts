// --- external
import { ref } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UwAvatar, useCustomElement } from "@upmind/upwind";
useCustomElement(UwAvatar);

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys, isFunction, find, findIndex } from "lodash-es";

// -----------------------------------------------------------------------------
enum shapes {
  circle = "Circle",
  square = "Square",
}
enum fits {
  cover = "Cover",
  contain = "Contain",
}

const meta: Meta<typeof UwAvatar> = {
  argTypes: {
    icon: useSystemArgTypes.icon,
    size: useSystemArgTypes.baseSizes,
    shape: {
      options: keys(shapes),
      control: {
        type: "radio",
        labels: shapes,
      },
    },
    fit: {
      options: keys(fits),
      control: {
        type: "radio",
        labels: fits,
      },
    },
  },
  args: {
    src: "",
    caption: "DC",
    size: "md",
    shape: "circle",
    icon: "",
    fit: "cover",
  },
  render: args => ({
    setup() {
      return { args };
    },
    template: `<uw-avatar v-bind="args" />`,
  }),
};

export default meta;
type Story = StoryObj<typeof UwAvatar>;

export const Base: Story = {};

export const Flag: Story = {
  args: {
    avatar: useSystemArgTypes.flag.options.find((flag, key) =>
      flag.includes("gb")
    ),
    caption: "GB",
    size: "md",
  },
};

export const Gravatar: Story = {
  args: {
    src: "https://www.gravatar.com/avatar/4289a4e6163b9adc987168444774435b?d=404&s=200",
    size: "md",
  },
};

export const SlotContent: Story = {
  parameters: {
    controls: { exclude: ["avatar", "caption"] },
    icon: useSystemArgTypes.icon,
  },
  args: {
    size: "md",
  },
  render: args => ({
    setup() {
      return {
        args,
      };
    },
    template: `
        <uw-avatar v-bind="args">
        <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="Monitor--Streamline-Ultimate.svg">
          <path d="M9 22.5a6.979 6.979 0 0 0 1.5 -4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"></path>
          <path d="M15 22.5a6.979 6.979 0 0 1 -1.5 -4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"></path>
          <path d="m7.499 22.5 9 0" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"></path>
          <path d="m0.5 15.5 23 0" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"></path>
          <path d="M1.5 1.5h21s1 0 1 1v15s0 1 -1 1h-21s-1 0 -1 -1v-15s0 -1 1 -1" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"></path>
        </svg>
        </uw-avatar>
    `,
  }),
};

export const GravatarWithText: Story = {
  args: {
    caption: "DC",
    src: "https://www.gravatar.com/avatar/98302662b1abcc4cfe17b1205cb53255?d=blank&s=200",
    size: "md",
  },
};

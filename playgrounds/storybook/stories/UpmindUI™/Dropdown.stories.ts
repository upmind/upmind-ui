// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import { DropdownMenu } from "@upmind-automation/upmind-ui";

// --- utils
import { useSystemArgTypes } from "../../utils";

// -----------------------------------------------------------------------------

const meta: Meta<typeof DropdownMenu> = {
  parameters: {
    controls: {
      exclude: [],
    },
  },
  component: DropdownMenu,
  argTypes: {
    size: useSystemArgTypes.size,
    placement: useSystemArgTypes.placement,
    prependAvatar: useSystemArgTypes.flag,
    prependIcon: useSystemArgTypes.icon,
    appendIcon: useSystemArgTypes.icon,
    appendAvatar: useSystemArgTypes.flag,
    toggle: useSystemArgTypes.icon,
  },
  args: {
    label: "Menu of actions",
    size: "md",
    prependText: undefined,
    prependAvatar: undefined,
    prependIcon: undefined,
    appendIcon: undefined,
    appendAvatar: undefined,
    appendText: undefined,
    // ---
    toggle: undefined,
    toggleRotate: true,
    placement: "bottom-start",
    items: {
      group1: {
        label: "Group 1",
        children: [
          {
            href: "#",
            label: "Item 1",
          },
          {
            href: "#",
            label: "Item 2",
          },
          {
            href: "#",
            label: "Item 3",
          },
        ],
      },
      group2: {
        label: "Group 2",

        children: {
          account: {
            href: "#",
            label: "Item 4",
          },
          support: { href: "#", label: "Item 5" },
          license: { href: "#", label: "Item 6" },
          signout: {
            href: "#",
            label: "Item 7",
          },
        },
      },
      alert: { icon: "cog", label: "Item 8", action: () => alert("Alert!") },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

export const Base: Story = {};

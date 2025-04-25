// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import {
  DropdownMenu,
  type DropdownMenuItemProps,
} from "@upmind-automation/upmind-ui";

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys } from "lodash-es";

// -----------------------------------------------------------------------------

const width = {
  xs: "Extra Small",
  sm: "Small",
  md: "Medium",
  lg: "Large",
  xl: "Extra Large",
  "2xl": "Extra Extra Large",
  auto: "Auto",
};
const meta: Meta<typeof DropdownMenu> = {
  parameters: {
    controls: {
      exclude: [],
    },
    docs: {
      story: {
        iframeHeight: 300,
      },
      description: {
        component: "A component that reveals a list of options when clicked.",
      },
    },
  },
  component: DropdownMenu,
  argTypes: {
    variant: useSystemArgTypes.variant,
    width: {
      options: keys(width),
      control: {
        type: "radio",
        labels: width,
      },
    },
    align: useSystemArgTypes.align,
  },
  args: {
    label: "Open",
    width: "xs",
    title: "My account",
    variant: "ghost",
    align: "start",
    // ---
    items: [
      {
        icon: "email",
        label: "Profile",
        value: "account",
        handler: () => alert("Profile clicked!"),
      },
      {
        icon: "information-circle",
        label: "Support",
        value: "support",
        handler: () => alert("Support clicked!"),
      },
      {
        icon: "logout",
        label: "Log out",
        value: "logout",
        handler: () => alert("Logged out!"),
      },
    ] as DropdownMenuItemProps[],
  },
};

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

export const Base: Story = {};

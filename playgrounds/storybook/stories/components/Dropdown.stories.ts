import {
  DropdownMenu,
  type DropdownMenuItemProps
} from "@upmind-automation/upmind-ui";
import { BUTTON_VARIANTS, DROPDOWN_WIDTHS } from "@upmind-automation/upmind-ui";
import { useSystemArgTypes } from "../../utils";
import type { Meta, StoryObj } from "@storybook/vue3";

// -----------------------------------------------------------------------------

const meta: Meta<typeof DropdownMenu> = {
  parameters: {
    controls: {
      exclude: []
    },
    docs: {
      story: {
        iframeHeight: 300
      },
      description: {
        component: "A component that reveals a list of options when clicked."
      }
    }
  },
  component: DropdownMenu,
  argTypes: {
    variant: {
      options: BUTTON_VARIANTS,
      control: {
        type: "select",
        labels: BUTTON_VARIANTS
      }
    },
    width: {
      options: DROPDOWN_WIDTHS,
      control: {
        type: "select",
        labels: DROPDOWN_WIDTHS
      }
    },
    align: useSystemArgTypes.align
  },
  args: {
    label: "Open",
    width: "xs",
    title: "My account",
    variant: "primary",
    align: "start",
    // ---
    items: [
      {
        icon: "email",
        label: "Profile",
        value: "account",
        handler: () => alert("Profile clicked!")
      },
      {
        icon: "information-circle",
        label: "Support",
        value: "support",
        handler: () => alert("Support clicked!")
      },
      {
        icon: "logout",
        label: "Log out",
        value: "logout",
        handler: () => alert("Logged out!")
      }
    ] as DropdownMenuItemProps[]
  }
};

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

export const Base: Story = {};

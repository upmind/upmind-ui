import { fn } from "@storybook/test";
import { html } from "lit";

// -----------------------------------------------------------------------------
// define our render function
const Button = ({ variant, color, size, label, onClick }) => {
  return html`
    <uw-button
      variant=${variant}
      color=${color}
      size=${size}
      @click=${onClick}
      label=${label}
    ></uw-button>
  `;
};

// -----------------------------------------------------------------------------

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
export default {
  title: "Upwind/Button",
  tags: ["autodocs"],
  render: args => Button(args),
  argTypes: {
    variant: {
      control: {
        type: "select",
        labels: {
          flat: "Flat",
          ghost: "Ghost",
          outline: "Outlined",
          link: "Link",
          tonal: "Tonal",
        },
      },
      options: ["flat", "ghost", "outline", "link", "tonal"],
    },
    color: {
      control: {
        type: "select",
        labels: {
          base: "Base",
          primary: "Primary",
          secondary: "Secondary",
          accent: "Accent",
          promotion: "Promotion",
          destructive: "Destructive",
          success: "Success",
          info: "Info",
          error: "Error",
          warning: "Warning",
        },
      },
      options: [
        "base",
        "primary",
        "secondary",
        "accent",
        "promotion",
        "destructive",
        "success",
        "info",
        "error",
        "warning",
      ],
    },
    size: {
      control: {
        type: "select",
        labels: {
          xs: "Extra small",
          sm: "Small",
          md: "Medium",
          lg: "Large",
          icon: "Icon",
        },
      },
      options: ["xs", "sm", "md", "lg", "icon"],
    },
    block: {
      control: { type: "boolean" },
    },
  },
  args: {
    onClick: fn(),
    variant: "flat",
    label: "Call to action",
    block: false,
    size: "md",
    color: "primary",
  },
};

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Base = {};

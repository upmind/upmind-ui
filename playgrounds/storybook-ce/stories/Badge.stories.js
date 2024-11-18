import { fn } from "@storybook/test";
import { html } from "lit";

// -----------------------------------------------------------------------------
// define our render function
const Badge = ({ variant, color, label }) => {
  return html`
    <uw-badge variant=${variant} color=${color} label=${label}></uw-badge>
  `;
};

// -----------------------------------------------------------------------------

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
export default {
  title: "Upwind/Badge",
  tags: ["autodocs"],
  render: args => Badge(args),
  argTypes: {
    variant: {
      control: {
        type: "select",
        labels: {
          flat: "Flat",
          outline: "Outlined",
          tonal: "Tonal",
        },
      },
      options: ["flat", "outline", "tonal"],
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
  },
  args: {
    variant: "flat",
    label: "On promotion",
    color: "promotion",
  },
};

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Base = {};

import { fn } from "@storybook/test";
import { Button } from "./Button";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
export default {
  title: "Example/Button",
  tags: ["autodocs"],
  render: args => Button(args),
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["flat", "ghost", "outlined", "link"],
    },
    color: {
      control: { type: "select" },
      options: ["primary", "secondary", "accent", "base"],
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
  },
  args: { onClick: fn() },
};

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary = {
  args: {
    color: "primary",
    label: "Button",
  },
};

export const Secondary = {
  args: {
    color: "secondary",
    label: "Button",
  },
};

export const Accent = {
  args: {
    color: "accent",
    label: "Button",
  },
};

export const Large = {
  args: {
    size: "lg",
    label: "Button",
  },
};

export const Small = {
  args: {
    size: "sm",
    label: "Button",
  },
};

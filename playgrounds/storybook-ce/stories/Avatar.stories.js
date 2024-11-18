import { fn } from "@storybook/test";
import { html } from "lit";

// -----------------------------------------------------------------------------
// define our render function
const Avatar = ({ shape, size, image, caption, icon }) => {
  return html`
    <uw-avatar
      shape=${shape}
      size=${size}
      src=${image}
      caption=${caption}
      icon=${icon}
    ></uw-avatar>
  `;
};

// -----------------------------------------------------------------------------

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
export default {
  title: "Upwind/Avatar",
  tags: ["autodocs"],
  render: args => Avatar(args),
  argTypes: {
    size: {
      control: {
        type: "select",
        avatars: {
          sm: "Small",
          md: "Medium",
          lg: "Large",
        },
      },
      options: ["sm", "md", "lg"],
    },
    shape: {
      control: {
        type: "radio",
        avatars: {
          sm: "Circle",
          md: "Square",
        },
      },
      options: ["circle", "square"],
    },
    icon: {
      control: { type: "text" },
    },
    image: {
      control: { type: "text" },
    },
    caption: {
      control: { type: "text" },
    },
  },
  args: {
    icon: "",
    image: "",
    caption: "DC",
    size: "md",
    shape: "circle",
  },
};

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Base = {};
export const Icon = { args: { icon: "za", size: "contain" } };
export const Gravatar = {
  args: {
    image:
      "https://www.gravatar.com/avatar/4289a4e6163b9adc987168444774435b?d=blank&s=200",
  },
};

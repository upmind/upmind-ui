// --- external

// -- components
import { Avatar } from "@upmind-automation/upmind-ui";
import {
  AVATAR_COLORS,
  AVATAR_SIZES,
  AVATAR_SHAPES,
  AVATAR_FIT
} from "@upmind-automation/upmind-ui";
import { useSystemArgTypes } from "../../utils";
import type { Meta, StoryObj } from "@storybook/vue3";

const meta: Meta<typeof Avatar> = {
  component: Avatar,
  argTypes: {
    icon: useSystemArgTypes.icon,
    color: {
      options: AVATAR_COLORS,
      control: {
        type: "select",
        labels: AVATAR_COLORS
      }
    },
    size: {
      options: AVATAR_SIZES,
      control: {
        type: "select",
        labels: AVATAR_SIZES
      }
    },
    shape: {
      options: AVATAR_SHAPES,
      control: {
        type: "select",
        labels: AVATAR_SHAPES
      }
    },
    fit: {
      options: AVATAR_FIT,
      control: {
        type: "radio",
        labels: AVATAR_FIT
      }
    }
  },
  args: {
    src: "",
    caption: "P",
    color: "primary",
    size: "md",
    shape: "circle",
    icon: "",
    fit: "cover"
  },
  parameters: {
    docs: {
      story: {
        iframeHeight: 130
      },
      description: {
        component:
          "A component to display user profile pictures, icons or initials."
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Base: Story = {};

export const Variants: Story = {
  parameters: {
    controls: { exclude: ["src", "icon", "avatar", "caption", "color", "size"] }
  },
  render: args => ({
    components: { Avatar },
    setup() {
      const colors = AVATAR_COLORS;
      const sizes = AVATAR_SIZES;
      const caption = "AV";

      const translateSize = (size: string) => {
        switch (size) {
          case "xs":
            return "Extra Small";
          case "sm":
            return "Small";
          case "md":
            return "Medium";
          case "lg":
            return "Large";
          case "xl":
            return "Extra Large";
          default:
            return size;
        }
      };

      return {
        args,
        colors,
        sizes,
        translateSize,
        caption
      };
    },
    template: `
        <div class="flex flex-col">
          <!-- Size labels at the top -->
          <div class="flex items-center mb-4">
            <div class="w-24"></div>
            <div
              v-for="size in sizes"
              :key="'label-' + size"
              class="text-center text-xs text-muted w-16 ml-4 first:ml-0"
            >
              {{ size }}
            </div>
          </div>

          <!-- Avatar rows by color -->
          <div v-for="color in colors" :key="color" class="flex items-center mb-4">
            <div class="capitalize font-semibold text-lg text-right w-24">{{ color }}</div>
            <div
              v-for="size in sizes"
              :key="color + size"
              class="flex items-center justify-center w-16 ml-4 first:ml-0"
            >
              <Avatar
                v-bind="args"
                :color="color"
                :size="size"
                :caption="caption"
              />
            </div>
          </div>
        </div>
    `
  })
};

export const Flag: Story = {
  parameters: {
    controls: { exclude: ["src", "icon", "avatar", "caption"] }
  },
  args: {
    icon: "gb",
    caption: "GB",
    size: "md"
  }
};

export const Gravatar: Story = {
  parameters: {
    controls: { exclude: ["src", "icon", "avatar", "caption"] }
  },
  args: {
    src: "https://www.gravatar.com/avatar/4289a4e6163b9adc987168444774435b?d=404&s=200",
    size: "md"
  }
};

export const SlotContent: Story = {
  parameters: {
    controls: { exclude: ["src", "icon", "avatar", "caption"] }
  },
  args: {
    size: "md",
    fit: "contain"
  },
  render: args => ({
    components: { Avatar },
    setup() {
      return {
        args
      };
    },
    template: `
        <Avatar v-bind="args">
        <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="Monitor--Streamline-Ultimate.svg">
          <path d="M9 22.5a6.979 6.979 0 0 0 1.5 -4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"></path>
          <path d="M15 22.5a6.979 6.979 0 0 1 -1.5 -4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"></path>
          <path d="m7.499 22.5 9 0" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"></path>
          <path d="m0.5 15.5 23 0" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"></path>
          <path d="M1.5 1.5h21s1 0 1 1v15s0 1 -1 1h-21s-1 0 -1 -1v-15s0 -1 1 -1" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"></path>
        </svg>
        </Avatar>
    `
  })
};

export const GravatarWithText: Story = {
  args: {
    caption: "DC",
    src: "https://www.gravatar.com/avatar/98302662b1abcc4cfe17b1205cb53255?d=blank&s=200",
    size: "md"
  }
};

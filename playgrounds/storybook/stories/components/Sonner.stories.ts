// --- external

// -- components
import { Sonner, toast, Button } from "@upmind-automation/upmind-ui";
import { TOAST_VARIANTS } from "@upmind-automation/upmind-ui";
import { useSystemArgTypes } from "../../utils";
import type { Meta, StoryObj } from "@storybook/vue3";

const meta: Meta<typeof Sonner> = {
  argTypes: {
    title: {
      control: "text",
      description: "The title to display in the toast"
    },
    description: {
      control: "text",
      description: "The description to display in the toast"
    },
    position: {
      control: "select",
      options: [
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right",
        "top-center",
        "bottom-center"
      ],
      description: "The direction in which the toast should appear"
    },
    closeButton: {
      control: "boolean",
      description: "Display the close button in the toast"
    },
    visibleToasts: {
      control: "number",
      description: "The number of visible toasts"
    },
    expand: {
      control: "boolean",
      description: "Expand toasts to be fully visible"
    },
    color: useSystemArgTypes.color
  },
  args: {
    title: "Toast!",
    description: "Change the properties in the controls",
    color: "neutral",
    position: "bottom-right",
    closeButton: false,
    visibleToasts: 3,
    expand: false,
    duration: 999999
  },
  parameters: {
    docs: {
      story: {
        iframeHeight: 350
      },
      description: {
        component:
          "A component for displaying non-intrusive notifications or toasts."
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Sonner>;

export const Base: Story = {
  render: args => ({
    components: { Sonner, Button },
    setup() {
      const showToast = () => {
        toast(args.title, {
          description: args.description,
          action: {
            label: "Undo",
            onClick: () => console.log("Undo")
          },
          type: args.color // Changed from 'color' to 'args.color'
        });
      };

      return { showToast, args, toast };
    },
    template: `
      <div class="p-8">
        <Sonner v-bind="args" />
        <Button
          :color="args.color"
          label="Click here for a Toast"
          @click="showToast"
        />
      </div>
    `
  })
};

export const Colors: Story = {
  parameters: {
    controls: { exclude: ["color"] }
  },
  render: args => ({
    components: { Sonner, Button },
    setup() {
      const colors = TOAST_VARIANTS;

      const showToast = (color: string) => {
        const capitalisedColorTitle =
          color.charAt(0).toUpperCase() + color.slice(1);
        toast(capitalisedColorTitle + " style toast", {
          description: "Change the properties in the controls",
          action: {
            label: "Undo",
            onClick: () => console.log("Undo")
          },
          type: color
        });
      };

      return {
        args,
        colors,
        showToast
      };
    },
    template: `
      <div>
        <div class="flex flex-wrap mx-16">
          <div
            v-for="color in colors"
            :key="'toast' + color"
            class="w-1/3 my-20 flex justify-center"
          >
            <Button :color="color" :label="color"
              @click="showToast(color)"
            />
          </div>
        </div>
        <Sonner v-bind="args" />
      </div>
    `
  })
};

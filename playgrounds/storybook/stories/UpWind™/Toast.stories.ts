// --- external
import { ref } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UwToaster, toast, UpwButton } from "@upmind/upwind";

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys } from "lodash-es";

// --- types
enum variants {
  outlined = "Outlined",
  solid = "Solid",
}

const meta: Meta<typeof UwToaster> = {
  component: UwToaster,
  argTypes: {
    variant: {
      options: keys(variants),
      control: {
        type: "radio",
        labels: variants,
      },
    },
    title: {
      control: "text",
      description: "The title to display in the toast",
    },
    description: {
      control: "text",
      description: "The description to display in the toast",
    },
    position: {
      control: "select",
      options: [
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right",
        "top-center",
        "bottom-center",
      ],
      description: "The direction in which the toast should appear",
    },
    closeButton: {
      control: "boolean",
      description: "Display the close button in the toast",
    },
    visibleToasts: {
      control: "number",
      description: "The number of visible toasts",
    },
    expand: {
      control: "boolean",
      description: "Expand toasts to be fully visible",
    },
    color: useSystemArgTypes.color,
  },
  args: {
    title: "Toast!",
    description: "Change the properties in the controls",
    color: "base",
    position: "bottom-right",
    closeButton: false,
    visibleToasts: 3,
    expand: false,
    duration: 999999,
  },
};

export default meta;
type Story = StoryObj<typeof UwToaster>;

export const Base: Story = {
  render: args => ({
    components: { UwToaster, UpwButton },
    setup() {
      const showToast = () => {
        toast(args.title, {
          description: args.description,
          action: {
            label: "Undo",
            onClick: () => console.log("Undo"),
          },
          type: color,
        });
      };

      return { showToast, args, toast };
    },
    template: `
      <div class="p-8">
        <UwToaster v-bind="args" />
        <upw-button
          :color="args.color"
          label="Click here for a Toast"
          @click="showToast"
        />
      </div>
    `,
  }),
};

export const Colors: Story = {
  parameters: {
    controls: { exclude: ["color"] },
  },
  render: args => ({
    components: { UwToaster, UpwButton },
    setup() {
      const colors = useSystemArgTypes.color;

      const showToast = (color: string) => {
        const capitalisedColorTitle =
          color.charAt(0).toUpperCase() + color.slice(1);
        toast(capitalisedColorTitle + " style toast", {
          description: "Change the properties in the controls",
          action: {
            label: "Undo",
            onClick: () => console.log("Undo"),
          },
          type: color,
        });
      };

      return {
        args,
        colors,
        showToast,
      };
    },
    template: `
      <div>
        <div class="flex flex-wrap mx-16">
          <div
            v-for="color in colors.options"
            :key="'toast' + color"
            class="w-1/3 my-20 flex justify-center"
          >
            <upw-button :color="color" :label="color"
              @click="showToast(color)"
            />
          </div>
        </div>
        <UwToaster v-bind="args" />
      </div>
    `,
  }),
};

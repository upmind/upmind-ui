// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UwAlert } from "@upmind/upwind";

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys } from "lodash-es";

// --- types
enum variants {
  outlined = "Outlined",
  solid = "Solid",
}

const meta: Meta<typeof UwAlert> = {
  component: UwAlert,
  argTypes: {
    variant: {
      options: keys(variants),
      control: {
        type: "radio",
        labels: variants,
      },
    },
    color: useSystemArgTypes.color,
    icon: useSystemArgTypes.icon,
  },
  args: {
    title: "Alert",
    description:
      "This is an example alert. Use the controls to change the apperance.",
    variant: "outlined",
    icon: "check-circle",
  },
};

export default meta;
type Story = StoryObj<typeof UwAlert>;

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    components: { UwAlert },
    setup() {
      return {
        args,
      };
    },
    methods: {
      doUpdate(value: boolean) {
        updateArgs({ modelValue: value });
      },
    },
    template: `
        <uw-alert v-bind="args" />
    `,
  }),
};

export const Colors: Story = {
  parameters: {
    controls: { exclude: ["color"] },
  },
  render: args => ({
    components: { UwAlert },
    setup() {
      const colors = useSystemArgTypes.color;
      return {
        args,
        colors,
      };
    },
    template: `
      <div 
        v-for="color in colors.options" 
        :key="color" 
        class="my-6"
      >
        <uw-alert
          v-bind="args" 
          :color="color" 
        />
      </div>
    `,
  }),
};

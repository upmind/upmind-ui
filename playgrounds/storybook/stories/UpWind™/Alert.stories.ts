// --- external
import type { Meta, StoryObj } from "@storybook/vue3";
import { ref } from "vue";

// -- components
import { UwAlert, useCustomElement } from "@upmind/upwind";
useCustomElement(UwAlert);

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys, isFunction } from "lodash-es";

// --- types
enum variants {
  outlined = "Outlined",
  solid = "Solid",
}

const meta: Meta<typeof UwAlert> = {
  argTypes: {
    variant: {
      options: keys(variants),
      control: {
        type: "radio",
        labels: variants,
      },
    },
    color: useSystemArgTypes.color,
  },
  args: {
    title: "Alert",
    description:
      "This is an example alert. Use the controls to change the apperance.",
    variant: "outlined",
  },
  render: args => ({
    setup() {
      return { args };
    },
    template: `
      <uw-alert v-bind="args" />
    `,
  }),
};

export default meta;
type Story = StoryObj<typeof UwAlert>;

export const Base: Story = {
  render: args => ({
    setup() {
      const icon = ref();
      const iconSvg = useSystemArgTypes.icon.options[9];
      if (isFunction(iconSvg))
        iconSvg().then(value => {
          icon.value = value;
        });

      return {
        args,
        icon,
      };
    },
    template: `
      <uw-alert v-bind="args">
        <span
          v-html="icon"
          slot="prepend"
        />
      </uw-alert>
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

// --- external
import { ref } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UwTooltip, UwButton, useCustomElement } from "@upmind/upwind";
useCustomElement(UwTooltip);
useCustomElement(UwButton);

// --- utils
import { useSystemArgTypes } from "../../utils";

const meta: Meta<typeof UwTooltip> = {
  argTypes: {
    label: {
      control: "text",
      description: "The text to display in the tooltip",
    },
    direction: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
      description: "The direction in which the tooltip should appear",
    },
    color: useSystemArgTypes.color,
    delayDuration: {
      control: "number",
      description: "The delay in ms for the tooltip to open",
    },
    sideOffset: {
      control: "number",
      description: "The distance of the tooltip in px from the element",
    },
  },
  args: {
    label: "This is a tooltip",
    direction: "right",
    color: "base",
    delayDuration: 300,
    sideOffset: 7,
  },
};

export default meta;
type Story = StoryObj<typeof UwTooltip>;

export const Base: Story = {
  render: args => ({
    setup() {
      return { args };
    },
    template: `
      <div class="p-8">
        <uw-tooltip v-bind="args">
          <uw-button label="Trigger" />
        </uw-tooltip>
      </div>
    `,
  }),
};

export const OpenClose: Story = {
  render: args => ({
    setup() {
      const open = ref(true);
      return { args, open };
    },
    template: `
        <div class="p-8">
          <uw-tooltip v-bind="args" :open="open">
            <uw-button :label="open ? 'Close' : 'Open'" @click="open = !open" :color="args.color" />
          </uw-tooltip>
        </div>
      `,
  }),
};

export const AllDirections: Story = {
  parameters: {
    controls: { exclude: ["direction"] },
  },
  render: args => ({
    setup() {
      const directions = ["Top", "Right", "Bottom", "Left"];
      return {
        directions,
        args,
      };
    },
    template: `
      <div class="flex flex-wrap mx-16">
        <div
          v-for="direction in directions"
          :key="direction"
          class="w-1/4 my-20 flex justify-center"
        >
          <uw-tooltip v-bind="args" :direction="direction.toLowerCase()">
            <div class="flex flex-col items-center">
              <div class="text-sm font-bold mt-2">{{ direction }}</div>
            </div>
          </uw-tooltip>
        </div>
      </div>
    `,
  }),
};

export const SlotContent: Story = {
  parameters: {
    controls: { exclude: ["label"] },
  },
  render: args => ({
    setup() {
      args.label = null;
      return {
        args,
      };
    },
    template: `
      <div class="p-8">
        <uw-tooltip v-bind="args">
          <uw-button label="Trigger" />
          <div
            slot="content"
            class="p-2 px-3 font-bold"
          >
            <div>You can do whatever you'd like in this slot</div>
          </div>
        </uw-tooltip>
      </div>
    `,
  }),
};

export const Colors: Story = {
  parameters: {
    controls: { exclude: ["color", "direction", "delayDuration"] },
  },
  render: args => ({
    setup() {
      const colors = useSystemArgTypes.color;
      return {
        args,
        colors,
      };
    },
    template: `
      <div class="flex flex-wrap mx-16">
        <div
          v-for="color in colors.options"
          :key="color.value"
          class="w-1/3 my-20 flex justify-center"
        >
          <uw-tooltip
            v-bind="args"
            direction="bottom"
            :color="color"
            :open="true"
          >
            <div class="flex flex-col items-center">
              <div class="text-sm font-bold mt-2">{{ color }}</div>
            </div>
          </uw-tooltip>
        </div>
      </div>
    `,
  }),
};

// --- external
import { ref } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { Tooltip, UwButton, UpwIcon } from "@upmind/upwind";

// --- utils
import { useSystemArgTypes } from "../../utils";

const meta: Meta<typeof Tooltip> = {
  component: Tooltip,
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
type Story = StoryObj<typeof Tooltip>;

export const Base: Story = {
  render: args => ({
    components: { Tooltip, UpwIcon },
    setup() {
      return { args };
    },
    template: `
      <div class="p-8">
        <Tooltip v-bind="args">
          <UpwIcon icon="devices" size="md" />
        </Tooltip>
      </div>
    `,
  }),
};

export const OpenClose: Story = {
  render: args => ({
    components: { Tooltip, UpwIcon, UwButton },
    setup() {
      const open = ref(true);
      return { args, open };
    },
    template: `
        <div class="p-8">
          <Tooltip v-bind="args" :open="open">
            <UwButton :label="open ? 'Close' : 'Open'" @click="open = !open" :color="args.color" />
          </Tooltip>          
        </div>
      `,
  }),
};

export const AllDirections: Story = {
  parameters: {
    controls: { exclude: ["direction"] },
  },
  render: args => ({
    components: { Tooltip, UpwIcon },
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
          <Tooltip v-bind="args" :direction="direction.toLowerCase()">
            <div class="flex flex-col items-center">
              <UpwIcon icon="devices" size="md" />
              <div class="text-sm font-bold mt-2">{{ direction }}</div>
            </div>
          </Tooltip>
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
    components: { Tooltip, UpwIcon },
    setup() {
      args.label = null;
      return {
        args,
      };
    },
    template: `
      <div class="p-8">
        <Tooltip v-bind="args">
          <UpwIcon icon="devices" size="md" />

          <template v-slot:content>
            <div class="p-2 px-3 font-bold">
              <div class="flex items-center justify-center py-4">
                <UpwIcon icon="check" size="sm" />
              </div>
              
              <div>You can do whatever you'd like in here</div>
            </div>
          </template>
        </Tooltip>
      </div>
    `,
  }),
};

export const Colors: Story = {
  parameters: {
    controls: { exclude: ["color", "direction", "delayDuration"] },
  },
  render: args => ({
    components: { Tooltip, UpwIcon },
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
          <Tooltip
            v-bind="args" 
            direction="bottom" 
            :color="color" 
            :open="true"
          >
            <div class="flex flex-col items-center">
              <UpwIcon icon="devices" size="md" />
              <div class="text-sm font-bold mt-2">{{ color }}</div>
            </div>
          </Tooltip>
        </div>
      </div>
    `,
  }),
};

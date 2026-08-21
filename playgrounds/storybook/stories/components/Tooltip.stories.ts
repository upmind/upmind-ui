import { ref } from "vue";
import { Tooltip, Button } from "@upmind-automation/upmind-ui";
import type { Meta, StoryObj } from "@storybook/vue3";

const meta: Meta<typeof Tooltip> = {
  argTypes: {
    label: {
      control: "text",
      description: "The text to display in the tooltip"
    },
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
      description: "The direction in which the tooltip should appear"
    },
    delayDuration: {
      control: "number",
      description: "The delay in ms for the tooltip to open"
    },
    sideOffset: {
      control: "number",
      description: "The distance of the tooltip in px from the element"
    }
  },
  args: {
    label: "This is a tooltip",
    side: "right",
    delayDuration: 300,
    sideOffset: 7
  },
  parameters: {
    docs: {
      story: {
        iframeHeight: 175
      },
      description: {
        component:
          "A small pop-up box that displays information when hovering over an element."
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Base: Story = {
  render: args => ({
    components: { Tooltip, Button },
    setup() {
      return { args };
    },
    template: `
      <div class="p-8">
        <Tooltip v-bind="args">
          <Button label="Hover" />
        </Tooltip>
      </div>
    `
  })
};

export const OpenClose: Story = {
  render: args => ({
    components: { Tooltip, Button },
    setup() {
      const open = ref(true);
      return { args, open };
    },
    template: `
      <div class="p-8">
        <Tooltip v-bind="args" :open="open">
          <Button :label="open ? 'Close' : 'Open'" @click="open = !open" />
        </Tooltip>
      </div>
    `
  })
};

export const AllDirections: Story = {
  parameters: {
    controls: { exclude: ["side"] }
  },
  render: args => ({
    components: { Tooltip },
    setup() {
      const sides = ["Top", "Right", "Bottom", "Left"];
      return {
        sides,
        args
      };
    },
    template: `
      <div class="flex flex-wrap mx-16">
        <div
          v-for="side in sides"
          :key="side"
          class="w-1/4 my-20 flex justify-center"
        >
          <Tooltip v-bind="args" :side="side.toLowerCase()">
            <div class="flex flex-col items-center">
              <div class="text-sm font-bold mt-2">{{ side }}</div>
            </div>
          </Tooltip>
        </div>
      </div>
    `
  })
};

export const SlotContent: Story = {
  parameters: {
    controls: { exclude: ["label"] }
  },
  render: args => ({
    components: { Tooltip, Button },
    setup() {
      return {
        args
      };
    },
    template: `
      <div class="p-8">
        <Tooltip v-bind="args">
          <Button label="Hover" />

          <template v-slot:content>
            <div
              class="p-2 px-3 font-bold"
            >
              <div>Place your custom content here</div>
            </div>
          </template>
        </Tooltip>
      </div>
    `
  })
};

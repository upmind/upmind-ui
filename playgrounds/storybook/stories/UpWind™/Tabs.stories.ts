// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import { UwTabs, useCustomElement } from "@upmind/upwind";

useCustomElement(UwTabs);

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys } from "lodash-es";
// -----------------------------------------------------------------------------

// --- types
enum variants {
  flat = "Flat",
  outline = "Outline",
  tonal = "Tonal",
}

enum alignments {
  start = "start",
  center = "center",
  end = "end",
  between = "between",
  around = "around",
  evenly = "evenly",
}

enum widths {
  full = "full",
  auto = "auto",
}

const meta: Meta<typeof UwTabs> = {
  argTypes: {
    variant: {
      options: keys(variants),
      control: {
        type: "radio",
        labels: variants,
      },
    },
    alignment: {
      options: keys(alignments),
      control: {
        type: "radio",
        labels: alignments,
      },
    },
    width: {
      options: keys(widths),
      control: {
        type: "radio",
        labels: widths,
      },
    },
    color: useSystemArgTypes.color,
  },
  args: {
    variant: "flat",
    color: "base",
    alignment: "evenly",
    width: "full",
  },
};

export default meta;
type Story = StoryObj<typeof UwTabs>;

// -----------------------------------------------------------------------------

export const Base: Story = {
  render: args => ({
    setup() {
      const tabs = ["Tab 1", "Tab 2", "Tab 3", "Tab 4", "Tab 5"];
      const colors = useSystemArgTypes.color;
      return {
        colors,
        tabs,
        args,
      };
    },
    template: `
      <div class="max-w-md">
        <uw-tabs default-value="Tab 1" class="w-full" .tabs="['tab1','tab2','tab3']">
          <span slot="trigger.tab1">In ipsum deserunt</span>
          <div slot="content.tab1">
            <p>Incididunt non ullamco nisi quis amet adipisicing commodo ex ea anim. Do proident ipsum aute ut veniam amet nisi Lorem quis incididunt non irure. Nisi ex ullamco eu quis. Fugiat eiusmod excepteur tempor id esse ex minim dolor do voluptate voluptate occaecat sit. Lorem nisi anim officia velit ad cillum nostrud est. Fugiat commodo Lorem officia commodo culpa ut consectetur sit qui laborum culpa est sit exercitation.</p>
          </div>

          <span slot="trigger.tab2">Id quis ad non</span>
          <div slot="content.tab2">
          <p>Lorem do ea non ea cillum dolor eiusmod. Voluptate quis magna dolore eu non cillum ullamco incididunt exercitation dolor. Aliquip incididunt aliqua commodo ullamco amet.</p>
          </div>

          <span slot="trigger.tab3">Pariatur consequat</span>
           <div slot="content.tab3">
            <p>Ullamco amet cillum esse sint minim ea. Veniam dolore proident veniam consequat est sint dolor eu ex ullamco esse dolore. Deserunt enim incididunt labore voluptate.</p>
          </div>

         </uw-tabs>
      </div>
    `,
  }),
};

export const Colors: Story = {
  parameters: {
    controls: { exclude: ["color"] },
  },
  render: args => ({
    setup() {
      const tabs = ["Tab 1", "Tab 2", "Tab 3", "Tab 4"];
      const colors = useSystemArgTypes.color;
      return {
        colors,
        tabs,
        args,
      };
    },
    template: `
      <div
        v-for="color in colors.options"
        :key="color"
        class="my-12"
      >
        <uw-tabs :default-value="color + '2'">
          <uw-tabs-list v-bind="args" :color="color">
            <uw-tabs-trigger v-bind="args" :color="color" v-for="(tab, index) in 5" :key="color + index" :value="color + index" class="capitalize">
              {{ color }} {{ index + 1 }}
            </uw-tabs-trigger>
          </uw-tabs-list>
        </uw-tabs>
      </div>
    `,
  }),
};

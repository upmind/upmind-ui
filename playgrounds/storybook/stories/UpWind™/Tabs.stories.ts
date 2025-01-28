// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import { Tabs } from "@upmind-automation/upmind-ui";

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys } from "lodash-es";
// -----------------------------------------------------------------------------

// --- types
enum variants {
  flat = "Flat",
  outline = "Outlined",
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

const meta: Meta<typeof Tabs> = {
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
    width: "auto",
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

// -----------------------------------------------------------------------------

export const Base: Story = {
  render: args => ({
    components: { Tabs },
    setup() {
      const tabs = [
        { label: "Tab 1", value: "tab1" },
        { label: "Tab 2", value: "tab2" },
        { label: "Tab 3", value: "tab3" },
      ];
      const colors = useSystemArgTypes.color;
      return {
        colors,
        tabs,
        args,
      };
    },
    template: `
      <Tabs default-value="tab1" :tabs="tabs" :color="args.color" :variant="args.variant" :width="args.width" :alignment="args.alignment">
        <template v-slot:content.tab1>
          <div class="bg-gray-50 rounded-lg p-3 px-6 text-sm text-gray-500">
            <p>Incididunt non ullamco nisi quis amet adipisicing commodo ex ea anim. Do proident ipsum aute ut veniam amet nisi Lorem quis incididunt non irure. Nisi ex ullamco eu quis. Fugiat eiusmod excepteur tempor id esse ex minim dolor do voluptate voluptate occaecat sit. Lorem nisi anim officia velit ad cillum nostrud est. Fugiat commodo Lorem officia commodo culpa ut consectetur sit qui laborum culpa est sit exercitation.</p>
          </div>
        </template>

        <template v-slot:content.tab2>
          <div slot="content.tab2" class="bg-gray-50 rounded-lg p-3 px-6 text-sm text-gray-500">
            <p>Lorem do ea non ea cillum dolor eiusmod. Voluptate quis magna dolore eu non cillum ullamco incididunt exercitation dolor. Aliquip incididunt aliqua commodo ullamco amet.</p>
          </div>
        </template>

        <template v-slot:content.tab3>
          <div slot="content.tab3" class="bg-gray-50 rounded-lg p-3 px-6 text-sm text-gray-500">
            <p>Ullamco amet cillum esse sint minim ea. Veniam dolore proident veniam consequat est sint dolor eu ex ullamco esse dolore. Deserunt enim incididunt labore voluptate.</p>
          </div>
        </template>
      </Tabs>
    `,
  }),
};

export const Colors: Story = {
  parameters: {
    controls: { exclude: ["color"] },
  },
  render: args => ({
    components: { Tabs },
    setup() {
      const tabs = [
        { label: "Tab 1", value: "tab1" },
        { label: "Tab 2", value: "tab2" },
        { label: "Tab 3", value: "tab3" },
        { label: "Tab 4", value: "tab4" },
        { label: "Tab 5", value: "tab5" },
      ];
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
        <Tabs default-value="tab1" :tabs="tabs" :color="color" :variant="args.variant" :width="args.width" :alignment="args.alignment" />
      </div>
    `,
  }),
};

// <Tabs :default-value="color + '2'">
// <Tabs-list v-bind="args" :color="color">
//   <Tabs-trigger v-bind="args" :color="color" v-for="(tab, index) in 5" :key="color + index" :value="color + index" class="capitalize">
//     {{ color }} {{ index + 1 }}
//   </Tabs-trigger>
// </Tabs-list>
// </Tabs>

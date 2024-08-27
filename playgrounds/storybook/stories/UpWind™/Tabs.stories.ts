// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import {
  UwTabs,
  UwTabsTrigger,
  UwTabsList,
  UwTabsContent,
} from "@upmind/upwind";

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys } from "lodash-es";
// -----------------------------------------------------------------------------

// --- types
enum variants {
  flat = "Flat",
  outlined = "Outlined",
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
  component: UwTabs,
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
    components: { UwTabs, UwTabsTrigger, UwTabsList, UwTabsContent },
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
        <uw-tabs default-value="Tab 3" class="w-full">
          <uw-tabs-list v-bind="args" class="w-full">
            <uw-tabs-trigger v-bind="args" v-for="(tab, index) in tabs" :key="'tab' + index" :value="tab">
              {{ tab }}
            </uw-tabs-trigger>
          </uw-tabs-list>
          <uw-tabs-content v-for="(tab, index) in tabs" :key="'tab' + index" :value="tab" class="w-full">
            <div class="bg-gray-100 rounded-lg h-44 flex items-center justify-center text-base-500">
              {{ tab }} Content
            </div>
          </uw-tabs-content>
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
    components: { UwTabs, UwTabsTrigger, UwTabsList, UwTabsContent },
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

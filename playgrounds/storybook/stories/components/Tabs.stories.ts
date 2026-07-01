import { Tabs } from "@upmind-automation/upmind-ui";
import { useSystemArgTypes } from "../../utils";
import type { Meta, StoryObj } from "@storybook/vue3";

const meta: Meta<typeof Tabs> = {
  args: {
    //
  },
  parameters: {
    docs: {
      story: {
        iframeHeight: 300
      },
      description: {
        component:
          "A component for organizing content into different sections accessible via tabs."
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Base: Story = {
  render: args => ({
    components: { Tabs },
    setup() {
      const tabs = [
        { label: "Tab 1", value: "tab1" },
        { label: "Tab 2", value: "tab2" },
        { label: "Tab 3", value: "tab3" }
      ];
      const colors = useSystemArgTypes.color;
      return {
        colors,
        tabs,
        args
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
    `
  })
};

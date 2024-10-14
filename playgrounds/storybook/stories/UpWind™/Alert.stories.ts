// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { UpwAlert } from "@upmind-automation/upwind";

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys } from "lodash-es";

// --- types
enum variants {
  inline = "Inline",
  stacked = "Stacked",
}
enum anchors {
  none = "None",
  top = "Top",
  bottom = "Bottom",
  left = "Left",
  right = "Right",
}
// -----------------------------------------------------------------------------

const meta: Meta<typeof UpwAlert> = {
  component: UpwAlert,
  argTypes: {
    variant: {
      options: keys(variants),
      control: {
        type: "radio",
        labels: variants,
      },
    },
    anchor: {
      options: keys(anchors),
      control: {
        type: "radio",
        labels: anchors,
      },
    },
    color: useSystemArgTypes.color,
    icon: useSystemArgTypes.icon,
  },
  args: {
    title: "Proident id magna in velit",
    text: "Proident id proident ullamco veniam. Dolor duis anim sunt cillum exercitation occaecat aliqua consectetur proident incididunt amet. Laboris velit nostrud irure pariatur Lorem ad tempor aute laboris cillum ad sint.",
    // data: `Tempor minim ad pariatur occaecat ut. Pariatur sit consectetur commodo eiusmod esse qui consequat. Veniam elit est reprehenderit cupidatat aute id ex voluptate anim duis aliquip.\n\n
    // Anim nulla et sit elit irure cupidatat ullamco commodo mollit id. Anim voluptate aliquip enim magna elit ea irure non in minim. Culpa aliquip veniam qui aliqua amet fugiat. Voluptate dolor esse id do ea aute amet culpa fugiat aliqua ipsum. Laborum laborum esse esse nulla sunt labore nostrud officia ea irure aute. Consequat dolore Lorem esse pariatur sunt magna sint qui aliquip culpa fugiat in ut adipisicing. Est esse irure esse sunt nisi nisi ex irure fugiat non.`,
    // ---
    anchor: "none",
    variant: "stacked",
    color: "base",
    block: false,
    // ---
    icon: undefined,
    // ---
    modelValue: true,
  },
};

export default meta;
type Story = StoryObj<typeof UpwAlert>;

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    components: { UpwAlert },
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
        <upw-alert v-bind="args" @update:modelValue="doUpdate" />
    `,
  }),
};

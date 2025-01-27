// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// -- components
import { Lineclamp } from "@upmind-automation/upwind";

// --- utils
import { useSystemArgTypes } from "../../utils";
import { keys, omit } from "lodash-es";
import { text } from "stream/consumers";

// --- types

// -----------------------------------------------------------------------------

const meta: Meta<typeof Lineclamp> = {
  component: Lineclamp,
  argTypes: {
    lines: {
      options: [1, 2, 3, 4, 5, 6],
      control: {
        type: "radio",
        // labels: [1, 2, 3, 4, 5, 6],
      },
    },
  },
  args: {
    labelMore: "Show more",
    labelLess: "Show less",
    lines: 3,
    forceOpen: false,
    text: "Nostrud sint officia amet do incididunt labore nostrud aute ipsum aute. Eiusmod anim veniam culpa officia ipsum excepteur culpa cillum consectetur ex. Ullamco voluptate ipsum aliqua reprehenderit magna occaecat nulla ea labore ipsum laborum nulla. Nisi cupidatat labore incididunt velit aliqua ut. Aliquip exercitation ex mollit velit culpa culpa velit ipsum consequat.",
  },
};

export default meta;
type Story = StoryObj<typeof Lineclamp>;

// export const Base: Story = {};

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    components: { Lineclamp },
    setup() {
      return {
        args: omit(args, ["text"]),
        text: args.text,
      };
    },
    methods: {
      doUpdate(value: boolean) {
        updateArgs({ modelValue: value });
      },
    },
    template: `
        <lineclamp v-bind="args">{{text}}</lineclamp>
    `,
  }),
};

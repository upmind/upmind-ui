// --- external

// -- components
import { Input } from "@upmind-automation/upmind-ui";
import { useSystemArgTypes } from "../../../utils";
import type { Meta, StoryObj } from "@storybook/vue3";

// --- types

// -----------------------------------------------------------------------------

const meta: Meta<typeof Text> = {
  parameters: {
    controls: { exclude: ["layout", "variant"] },
    docs: {
      description: {
        component: "A single-line text input field for collecting user input."
      }
    }
  },
  component: Input,
  argTypes: {
    size: useSystemArgTypes.size,
    // ---
    prependAvatar: useSystemArgTypes.flag,
    prependIcon: useSystemArgTypes.icon,
    // ---
    appendAvatar: useSystemArgTypes.flag,
    appendIcon: useSystemArgTypes.icon,
    // ---
    feedbackIcon: useSystemArgTypes.icon
  },
  args: {
    label: "What is your name?",
    description: "Please enter your full name",
    errors: undefined,
    // ---
    modelValue: undefined,
    // ---
    size: "md",
    autosize: false,
    // ---
    prependAvatar: undefined,
    prependIcon: undefined,
    prependText: undefined,
    appendIcon: undefined,
    appendAvatar: undefined,
    appendText: undefined,
    // ---
    required: false,
    disabled: false,
    visible: true,
    mask: undefined
  }
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    components: { Input },
    setup() {
      return {
        args
      };
    },
    methods: {
      doUpdate(value: boolean) {
        updateArgs({ modelValue: value });
      }
    },
    template: `
        <Input v-bind="args" @update:modelValue="doUpdate" />
    `
  })
};

export const States: Story = {
  parameters: {
    controls: { exclude: ["modelValue"] }
  },
  argTypes: {
    label: { control: "text" }
  },
  args: {
    label: "Text Label"
  },
  render: (args: any) => ({
    components: { Input },
    setup() {
      return {
        args
      };
    },
    template: `
    <section class="flex flex-col gap-4 max-w-xl">
      <div>
        <h3 class="text-sm-loose text-muted">Default</h3>
        <Input
          :label="args.label"
        />
      </div>

      <div>
        <h3 class="text-sm-loose text-muted">Hover</h3>
        <Input
          :label="args.label"
          data-hover="true"
        />
      </div>

      <div>
        <h3 class="text-sm-loose text-muted">Focused</h3>
        <Input
        :label="args.label"
        data-focus="true"
      />
      </div>

      <div>
        <h3 class="text-sm-loose text-muted">Text value</h3>
        <Input
          :label="args.label"
          :model-value="'Sample Text content'"
        />
      </div>

      <div>
        <h3 class="text-sm-loose text-muted">Masked value</h3>
        <Input
          :label="args.label"
          model-value=""
         :mask="/^\d+$/"
          placeholder="MM/YYYY"
          class="w-26"
        />
      </div>
    </section>
    `
  })
};

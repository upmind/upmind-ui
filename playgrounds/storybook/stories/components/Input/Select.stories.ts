// --- external

// -- components
import { Select } from "@upmind-automation/upmind-ui";
import {
  SELECT_WIDTHS,
  SELECT_SIZES,
  type SelectItemProps,
  type SelectItemAdditional
} from "@upmind-automation/upmind-ui";
import type { Meta, StoryObj } from "@storybook/vue3";

const meta: Meta<typeof Select> = {
  parameters: {
    controls: { exclude: ["items"] }
  },
  component: Select,
  argTypes: {
    width: {
      control: "select",
      options: SELECT_WIDTHS
    },
    size: {
      control: "select",
      options: SELECT_SIZES
    }
  },
  args: {
    modelValue: undefined,

    width: "auto",
    size: "md",
    items: [
      {
        value: "1",
        textValue: "Option 1"
      },
      {
        value: "2",
        textValue: "Option 2"
      },
      {
        value: "3",
        textValue: "Option 3"
      },
      {
        value: "4",
        textValue: "Option 4"
      }
    ] as SelectItemProps[],
    additionalItems: [
      {
        value: "new",
        textValue: "Add new",
        icon: "plus-circle",
        emitOnly: true
      }
    ] as SelectItemAdditional[]
  }
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    components: { Select },
    setup() {
      return {
        args
      };
    },
    methods: {
      doUpdate(value: string) {
        if (value === "new") {
          alert(`Adding new...`);
          updateArgs({ modelValue: null });
        } else {
          updateArgs({ modelValue: value });
        }
      }
    },
    template: `
    <div class="max-w-sm">
      <Select v-bind="args" @update:modelValue="doUpdate" />
    </div>
    `
  })
};

export const States: Story = {
  render: (args, { updateArgs }) => ({
    components: { Select },
    setup() {
      const width = "full";
      return {
        args,
        width
      };
    },
    methods: {
      doUpdate(value: string) {
        if (value === "new") {
          alert(`Adding new...`);
          updateArgs({ modelValue: null });
        } else {
          updateArgs({ modelValue: value });
        }
      }
    },
    template: `
        <section class="flex flex-col gap-4 max-w-sm">
      <div>
        <h3 class="text-sm-loose text-muted">Default</h3>

        <Select v-bind="args" @update:modelValue="doUpdate" :width="width" />
      </div>

      <div>
        <h3 class="text-sm-loose text-muted">Hover</h3>

        <Select v-bind="args" @update:modelValue="doUpdate" data-hover="true" :width="width" />
      </div>

      <div>
        <h3 class="text-sm-loose text-muted">Focused</h3>

        <Select v-bind="args" @update:modelValue="doUpdate" data-focus="true" :width="width" />
      </div>

      <div>
        <h3 class="text-sm-loose text-muted">Selected</h3>

        <Select v-bind="args" @update:modelValue="doUpdate" model-value="1" :width="width" />
      </div>

      <div>
        <h3 class="text-sm-loose text-muted">Error / Invalid</h3>

        <Select v-bind="args" @update:modelValue="doUpdate" aria-invalid="true" :width="width" />
      </div>
    </section>
    `
  })
};

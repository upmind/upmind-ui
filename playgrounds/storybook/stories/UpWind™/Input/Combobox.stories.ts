// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import { UpwCombobox, UpwInput } from "@upmind/upwind";

// --- utils
import { useSystemArgTypes } from "../../../utils";
import countries from "../../../utils/countries";

// --- types

// -----------------------------------------------------------------------------

const meta: Meta<typeof UpwCombobox> = {
  parameters: {
    controls: { exclude: ["size", "search"] },
  },
  component: UpwCombobox,
  subcomponents: { UpwInput },
  argTypes: {
    placement: useSystemArgTypes.placement,
    // ---
    prependAvatar: useSystemArgTypes.flag,
    prependIcon: useSystemArgTypes.icon,
    appendAvatar: useSystemArgTypes.flag,
    appendIcon: useSystemArgTypes.icon,
    feedbackIcon: useSystemArgTypes.icon,
    selectedIcon: useSystemArgTypes.icon,
    toggleIcon: useSystemArgTypes.icon,
    toggleRotate: {
      if: { arg: "toggleIcon", truthy: true },
    },
  },
  args: {
    label: "Select a phrase..",
    prependAvatar: undefined,
    prependIcon: undefined,
    appendAvatar: undefined,
    appendIcon: undefined,
    feedbackIcon: undefined,
    selectedIcon: "check",
    toggleIcon: undefined,
    toggleRotate: false,
    // ---
    placement: "bottom-end",
    items: {
      item1: {
        value: "item1",
        label:
          "Amet eiusmod proident duis reprehenderit sit aliquip ad do aliquip velit.",
      },
      item2: {
        value: "item2",
        label: "Ullamco sit velit voluptate cupidatat elit elit magna anim.",
      },
      item3: {
        value: "item3",
        label:
          "Reprehenderit duis irure nostrud labore fugiat quis officia cupidatat exercitation pariatur nostrud nisi minim ea.",
      },
      item4: {
        value: "item4",
        label:
          "Aliquip dolor voluptate amet tempor duis velit ipsum reprehenderit veniam.",
      },
      item5: {
        value: "item5",
        label:
          "Id exercitation laboris proident excepteur voluptate officia exercitation cillum mollit elit.",
      },
      item6: { value: "item6", label: "Do cillum nulla mollit ad pariatur." },
      item7: {
        value: "item7",
        label:
          "Minim aute laborum reprehenderit commodo laborum pariatur elit ex fugiat ea adipisicing velit nisi mollit.",
      },
      item8: {
        value: "item8",
        label: "Sunt dolore ipsum id fugiat Lorem aliqua aute sint.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof UpwCombobox>;

// -----------------------------------------------------------------------------

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    components: { UpwCombobox },
    setup() {
      return {
        args,
      };
    },
    methods: {
      doUpdate(value: string) {
        updateArgs({ modelValue: value });
      },
    },
    template: `
        <upw-combobox v-bind="args" @update:modelValue="doUpdate" />
    `,
  }),
};

export const Countries: Story = {
  parameters: {
    controls: { exclude: ["label", "items"] },
  },
  render: (args, { updateArgs }) => ({
    components: { UpwCombobox },
    setup() {
      return {
        args,
      };
    },
    methods: {
      doUpdate(value: string) {
        updateArgs({ modelValue: value });
      },
    },
    template: `
        <upw-combobox v-bind="args" @update:modelValue="doUpdate" />
    `,
  }),
  args: {
    label: "Select a Country",
    items: countries,
  },
};

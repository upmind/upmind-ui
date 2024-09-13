// --- external
import type { Meta, StoryObj } from "@storybook/vue3";
import { ref } from "vue";

// -- components
import { UwDrawer, UwButton, useCustomElement } from "@upmind/upwind";
useCustomElement(UwDrawer);
useCustomElement(UwButton);

// --- utils
import { first } from "lodash-es";
// -----------------------------------------------------------------------------

const meta: Meta<typeof UwDrawer> = {
  args: {
    modelValue: false,
    title: "Are you absolutely sure?",
    description: "This action cannot be undone.",
  },
};

export default meta;
type Story = StoryObj<typeof UwDrawer>;

export const Base: Story = {
  render: (args, { updateArgs }) => ({
    setup() {
      const toggleOpen = () => {
        updateArgs({ modelValue: !args.modelValue });
      };
      const onOpen = ({ detail }) => {
        const { isOpen = false } = first(detail);
        updateArgs({ modelValue: isOpen });
      };

      return {
        args,
        toggleOpen,
        onOpen,
      };
    },
    template: `
      <uw-drawer v-bind="args" @input="onOpen">
        <uw-button slot="trigger">Open Drawer</uw-button>
        <uw-button slot="close" block>Close</uw-button>
      </uw-drawer>
    `,
  }),
};

export const MockedAsyncAction: Story = {
  render: (args, { updateArgs }) => ({
    setup() {
      const loading = ref(false);
      let seconds = ref(3);

      const toggleOpen = () => {
        updateArgs({ modelValue: !args.modelValue });
      };
      const onOpen = ({ detail }) => {
        const { isOpen = false } = first(detail);
        updateArgs({ modelValue: isOpen });
      };

      const start = () => {
        loading.value = true;
        if (seconds.value === 1) {
          toggleOpen();
          loading.value = false;
          seconds.value = 3;
        } else {
          seconds.value--;
          setTimeout(() => {
            start();
          }, 1000);
        }
      };

      return {
        seconds,
        loading,
        open,
        args,
        start,
        toggleOpen,
        onOpen,
      };
    },
    template: `
      <uw-button @click="toggleOpen">Open Drawer</uw-button>
      <uw-drawer
        v-bind="args"
        @input="onOpen"
        title="Mocked asynchronous action"
        :description="seconds + ' seconds remaining'"
      >
        <uw-button slot="footer" size="sm" @click="start" :loading="loading" block>Begin</uw-button>
      </uw-drawer>
    `,
  }),
};

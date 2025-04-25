// --- external
import type { Meta, StoryObj } from "@storybook/vue3";
import { ref } from "vue";

// -- components
import { Drawer, Button } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const meta: Meta<typeof Drawer> = {
  args: {
    title: "Are you absolutely sure?",
    description: "This action cannot be undone.",
  },
  parameters: {
    docs: {
      story: {
        iframeHeight: 400,
      },
      description: {
        component:
          "A panel that slides in from the edge of the screen, typically used for supplementary content.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Drawer>;

export const Base: Story = {
  render: args => ({
    components: { Drawer, Button },
    setup() {
      const open = ref(false);
      return {
        open,
        args,
      };
    },
    template: `
      <Drawer
        v-bind="args"
        v-model:open="open"
        width="xl"
      >
        <template v-slot:trigger>
          <Button size="md">Open Dialog</Button>
        </template>

        <template v-slot:footer>
          <Button size="md">Confirm</Button>
          <Button size="md" variant="ghost">Cancel</Button>
        </template>
      </Drawer>
    `,
  }),
};

export const MockedAsyncAction: Story = {
  render: args => ({
    components: { Drawer, Button },
    setup() {
      const open = ref(false);
      const loading = ref(false);
      let seconds = ref(3);

      const start = () => {
        loading.value = true;
        if (seconds.value === 1) {
          open.value = false;
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
      };
    },
    template: `
      <Button @click="open = true">Open Drawer</Button>
      <Drawer
        v-bind="args"
        v-bind:open="open"
        title="Mocked asynchronous action"
        :description="seconds + ' seconds remaining'"
        :showClose="false"
        width="xl"
      >
        <Button @click="start" :loading="loading" block>Begin</Button>
      </Drawer>
    `,
  }),
};

// --- external
import type { Meta } from "@storybook/vue3";

// --- components
import { VApp, VHeroDedicatedServersContent } from "@velia/velia";
// -----------------------------------------------------------------------------

const meta: Meta<typeof VApp> = {
  component: VApp,
  argTypes: {
    items: {
      control: { type: "number" },
    },
  },
  args: {
    items: 5,
  },
};

export default meta;
export const Base = args => ({
  components: { VApp, VHeroDedicatedServersContent },
  setup() {
    return { args };
  },
  template: `
    <div class="-m-4 sm:-m-8">
      <v-app>
        <!-- Hero -->
        <template #hero>
          <v-hero-dedicated-servers-content />
        </template>

        <!-- Content -->
        <div class="flex flex-wrap justify-center -ml-3 -mr-3">
          <div v-for="i in args.items" :key="i" class="w-full sm:w-1/2 lg:w-1/3 px-3 pb-8">
            <div class="bg-white rounded-lg h-96 shadow-lg border border-gray-100 w-full" />
          </div>
        </div>
      </v-app>
    </div>
  `,
});

// --- external
import type { Meta } from "@storybook/vue3";

// --- components
import { VApp, VHero } from "@velia/velia";
// -----------------------------------------------------------------------------

const meta: Meta<typeof VApp> = {
  component: VApp,
};

export default meta;
export const Base = () => ({
  components: { VApp, VHero },
  template: `
    <div class="-m-4">
      <v-app>
        <!-- Hero -->
        <template #hero>
          <v-hero />
        </template>

        <!-- Content -->
        <div>
          <div class="bg-white rounded-lg w-full h-96 border" />
        </div>
      </v-app>
    </div>
  `,
});

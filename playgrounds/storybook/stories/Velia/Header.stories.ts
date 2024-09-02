// --- external
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import {
  VHeroImage,
  VHeroContainer,
  VHeader,
  VHeroContentContainer,
} from "@velia/velia";

const meta: Meta<typeof VHeader> = {
  component: VHeader,
};

export default meta;
type Story = StoryObj<typeof VHeader>;

// -----------------------------------------------------------------------------
export const Base = args => ({
  components: { VHeroImage, VHeroContainer, VHeader, VHeroContentContainer },
  setup() {
    return { args };
  },
  template: `
    <v-hero-image>
      <v-hero-container>
        <v-header />
      </v-hero-container>
    </v-hero-image>
  `,
});

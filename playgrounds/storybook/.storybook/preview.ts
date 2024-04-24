// --- styles
import "../stories/assets/main.css";

// --- external
import { setup } from "@storybook/vue3";
import { withUpwindTheme } from "./withUpwindTheme.decorator";

// --- internal
import upwind from "../plugins/upwind";
import themes from "@/assets/themes";

// --- utils

// --- types
import type { Preview } from "@storybook/your-renderer";
// -----------------------------------------------------------------------------

setup(app => {
  app.use(upwind);
});

const preview: Preview = {
  parameters: {
    backgrounds: { disable: true },
    layout: "fullscreen",
  },
  decorators: [
    withUpwindTheme({
      themes,
      defaultTheme: "light",
    }),
  ],
};

export default preview;

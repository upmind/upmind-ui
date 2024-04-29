// --- styles
import "../stories/assets/main.css";

// --- external
import { setup } from "@storybook/vue3";
import { withUpwindTheme } from "./withUpwindTheme.decorator";
import { useArgs } from "@storybook/preview-api";

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
    (story, context) => {
      // This make sit possible to updateArgs within stories
      const [_, updateArgs] = useArgs();
      return story({ ...context, updateArgs });
    },
  ],
};

export default preview;

// --- externals

// --- internal
import ThemeProvider from "../.storybook/Provider.vue";

// --- types
import type { App, Plugin } from "vue";

// -----------------------------------------------------------------------------

const upwindPlugin: Plugin = {
  install: (app: App): void => {
    app.component("UpwProvider", ThemeProvider);
  },
};

export default upwindPlugin;

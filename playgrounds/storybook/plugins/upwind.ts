// --- externals

// --- internal
import ThemeProvider from "../.storybook/ThemeProvider.vue";

// --- types
import type { App, Plugin } from "vue";

// -----------------------------------------------------------------------------

const upwindPlugin: Plugin = {
  install: (app: App): void => {
    app.component("UpwThemeProvider", ThemeProvider);
  },
};

export default upwindPlugin;

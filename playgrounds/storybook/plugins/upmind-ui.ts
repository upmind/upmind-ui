// --- externals

// --- internal
import ThemeProvider from "../.storybook/Provider.vue";

// --- types
import type { App, Plugin } from "vue";

// -----------------------------------------------------------------------------

const upmindUI: Plugin = {
  install: (app: App): void => {
    app.component("UpwProvider", ThemeProvider);
  },
};

export default upmindUI;

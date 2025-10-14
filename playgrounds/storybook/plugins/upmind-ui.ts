// --- externals

// --- internal
import { plugins as uiPlugins } from "@upmind-automation/upmind-ui";

// --- types
import type { App, Plugin } from "vue";

// -----------------------------------------------------------------------------

const upmindUI: Plugin = {
  install: (app: App): void => {
    app.use(uiPlugins.lottie.plugin);
  }
};

export default upmindUI;

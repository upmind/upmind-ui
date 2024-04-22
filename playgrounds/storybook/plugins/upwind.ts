// --- globals
import { ref, watch } from "vue";

// --- internal
import ThemeProvider from "../.storybook/ThemeProvider.vue";

// --- utils

// --- types
import type { App, Plugin } from "vue";

// -----------------------------------------------------------------------------

const upwindPlugin: Plugin = {
  install: (app: App): void => {
    const activeTheme = ref("light");
    const upwindStyles = ref({});

    app.provide("activeTheme", activeTheme);
    app.provide("upwind", upwindStyles);

    app.component("UpwThemeProvider", ThemeProvider);
  },
};

export default upwindPlugin;

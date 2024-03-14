import themer from "tailwindcss-themer";
import typography from "@tailwindcss/typography";
import forms from "@tailwindcss/forms";
import preline from "preline/plugin";

// --- utils
import { find, omit } from "lodash-es";

// --- Themes
import themes from "./src/assets/themes";
const defaultTheme = omit(find(themes, ["name", "Light"]), [
  "selectors",
  "mediaQuery",
]);

// -----------------------------------------------------------------------------

export default {
  darkMode: "media", // Honour the OS preference
  content: [
    "./src/**/*.{html,vue,js,tsx}",
    "./src/components/prelineRenderers/styles/*.ts",
    "../packages/ui/src/**/*.{html,vue,js,tsx}",
    "../../node_modules/preline/preline.js",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    themer({
      defaultTheme,
      themes,
    }),
    // ...
    typography,
    forms({
      strategy: "class", // only generate classes, otherwise use 'base'
    }),
    preline,
  ],
  safelist: ["object-cover", "opacity-40"],
};

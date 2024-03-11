/* global require, module*/
import type { Config } from "tailwindcss";

import themer from "tailwindcss-themer";
import typography from "@tailwindcss/typography";
import forms from "@tailwindcss/forms";
import preline from "preline/plugin";
import defaultTheme from "tailwindcss/defaultTheme";

// --- utils
import { find, omit } from "lodash-es";

// --- Themes
import themes from "./src/assets/themes";

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
    extend: {
      sans: ['"Proxima Nova"', ...defaultTheme.fontFamily.sans],
      serif: ['"Proxima Nova"', ...defaultTheme.fontFamily.serif],
      mono: ['"Proxima Nova"', ...defaultTheme.fontFamily.mono],
    },
  },
  plugins: [
    themer({
      defaultTheme: omit(find(themes, ["name", "Simple"]), [
        "selectors",
        "mediaQuery",
      ]),
      themes,
    }),
    // ...
    typography,
    forms({
      strategy: "class", // only generate classes, otherwise use 'base'
    }),
    preline,
  ],
} satisfies Config;

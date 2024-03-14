/* global require, module*/
import type { Config } from "tailwindcss";

import themer from "tailwindcss-themer";
import typography from "@tailwindcss/typography";
import forms from "@tailwindcss/forms";
import preline from "preline/plugin";

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
      // that is animation class
      animation: {
        fade: "fadeOut 300ms ease-in-out",
      },
      // that is actual animation
      keyframes: theme => ({
        fadeOut: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      }),
    },
  },
  plugins: [
    themer({
      defaultTheme: omit(find(themes, ["name", "Light"]), [
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
  safelist: ["object-cover", "opacity-40"],
} satisfies Config;

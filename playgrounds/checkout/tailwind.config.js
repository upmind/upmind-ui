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
    "../../packages/upwind/src/**/*.{html,vue,js,tsx,ts}",
  ],
  theme: {
    extend: {
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            "--tw-prose-body": theme("colors.base[800]"),
            "--tw-prose-headings": theme("colors.base[900]"),
            "--tw-prose-lead": theme("colors.base[700]"),
            "--tw-prose-links": theme("colors.base[900]"),
            "--tw-prose-bold": theme("colors.base[900]"),
            "--tw-prose-counters": theme("colors.base[600]"),
            "--tw-prose-bullets": theme("colors.base[400]"),
            "--tw-prose-hr": theme("colors.base[300]"),
            "--tw-prose-quotes": theme("colors.base[900]"),
            "--tw-prose-quote-borders": theme("colors.base[300]"),
            "--tw-prose-captions": theme("colors.base[700]"),
            "--tw-prose-code": theme("colors.base[900]"),
            "--tw-prose-pre-code": theme("colors.base[100]"),
            "--tw-prose-pre-bg": theme("colors.base[900]"),
            "--tw-prose-th-borders": theme("colors.base[300]"),
            "--tw-prose-td-borders": theme("colors.base[200]"),
            "--tw-prose-invert-body": theme("colors.base[200]"),
            "--tw-prose-invert-headings": theme("colors.white"),
            "--tw-prose-invert-lead": theme("colors.base[300]"),
            "--tw-prose-invert-links": theme("colors.white"),
            "--tw-prose-invert-bold": theme("colors.white"),
            "--tw-prose-invert-counters": theme("colors.base[400]"),
            "--tw-prose-invert-bullets": theme("colors.base[600]"),
            "--tw-prose-invert-hr": theme("colors.base[700]"),
            "--tw-prose-invert-quotes": theme("colors.base[100]"),
            "--tw-prose-invert-quote-borders": theme("colors.base[700]"),
            "--tw-prose-invert-captions": theme("colors.base[400]"),
            "--tw-prose-invert-code": theme("colors.white"),
            "--tw-prose-invert-pre-code": theme("colors.base[300]"),
            "--tw-prose-invert-pre-bg": "rgb(0 0 0 / 50%)",
            "--tw-prose-invert-th-borders": theme("colors.base[600]"),
            "--tw-prose-invert-td-borders": theme("colors.base[700]"),
          },
        },
      }),
    },
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
};

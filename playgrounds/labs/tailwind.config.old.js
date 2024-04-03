/* global require, module*/
const themes = require("./src/assets/themes");
const { find, omit } = require("lodash");
const defaultTheme = omit(find(themes, ["name", "Light"]), [
  "selectors",
  "mediaQuery",
]);

// console.log(themes);
// -----------------------------------------------------------------------------

module.exports = {
  darkMode: "media", // Honour the OS preference
  content: [
    "./src/**/*.{html,vue,js,tsx}",
    "./src/components/prelineRenderers/styles/*.ts",
    "../packages/client/src/**/*.{html,vue,js,tsx}",
    "../../node_modules/preline/preline.js",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("tailwindcss-themer")({
      defaultTheme,
      themes,
    }),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms")({
      strategy: "class", // only generate classes, otherwise use 'base'
    }),
    require("preline/plugin"),
  ],
};

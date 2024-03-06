/* global require, module*/

module.exports = {
  darkMode: "media", // Honour the OS preference
  content: [
    "./src/**/*.{html,vue,js,tsx}",
    "../packages/ui/src/**/*.{html,vue,js,tsx}",
    "../../node_modules/preline/preline.js",
  ],

  theme: {
    extend: require("./tailwind.theme"),
  },

  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("preline/plugin"),
  ],
};

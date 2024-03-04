/* global  require,module*/

module.exports = {
  content: ["./src/**/*.{vue,js,ts}", "../packages/ui/src/**/*.{vue,js,ts}"],
  plugins: [require("@tailwindcss/typography", require("preline/plugin"))],
  theme: {}
};

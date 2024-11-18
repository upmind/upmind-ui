import theme from "./tailwind.config.js";
import upwind from "./upwind.config.js";

export default {
  name: "Light",
  id: "light",
  selectors: ['[data-theme="light"]'],
  mediaQuery: "@media (prefers-color-scheme: light)",
  extend: theme,
  upwind,
};

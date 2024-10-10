import theme from "./tailwind.config.js";
import upwind from "./upwind.config.js";

export default {
  id: "dark",
  name: "Dark",
  selectors: [".dark-mode", '[data-theme="dark"]'],
  mediaQuery: "@media (prefers-color-scheme: dark)",
  extend: theme,
  upwind,
};

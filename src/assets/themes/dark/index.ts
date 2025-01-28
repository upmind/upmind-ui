import theme from "./tailwind.config";
import upmindUI from "./upmind-ui.config";

export default {
  id: "dark",
  name: "Dark",
  selectors: [".dark-mode", '[data-theme="dark"]'],
  mediaQuery: "@media (prefers-color-scheme: dark)",
  extend: theme,
  upmindUI,
};

import theme from "./tailwind.config";
import upwind from "./upwind.config";

export default {
  id: "dark",
  name: "Dark",
  selectors: [".dark-mode", '[data-theme="dark"]'],
  mediaQuery: "@media (prefers-color-scheme: dark)",
  extend: theme,
  upwind,
};

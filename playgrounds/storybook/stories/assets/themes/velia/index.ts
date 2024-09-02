import theme from "./tailwind.config";
import upwind from "./upwind.config";

export default {
  name: "Velia",
  id: "velia",
  selectors: ['[data-theme="velia"]'],
  mediaQuery: "@media (prefers-color-scheme: light)",
  extend: theme,
  upwind,
};

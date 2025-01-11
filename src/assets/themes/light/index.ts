import theme from "./tailwind.config";
import upmindUI from "./upmind-ui.config";

export default {
  name: "Light",
  id: "light",
  selectors: ['[data-theme="light"]'],
  mediaQuery: "@media (prefers-color-scheme: light)",
  extend: theme,
  upmindUI,
};

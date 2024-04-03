import theme from "./tailwind.config";

export default {
  name: "Light",
  id: "light",
  selectors: ['[data-theme="light"]'],
  mediaQuery: "@media (prefers-color-scheme: light)",
  extend: theme,
};

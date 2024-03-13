import theme from "./tailwind.theme";

export default {
  name: "Light",
  id: "light",
  selectors: ['[data-theme="light"]'],
  mediaQuery: {},
  extend: theme,
};

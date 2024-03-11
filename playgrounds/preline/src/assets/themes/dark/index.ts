import theme from "./tailwind.theme";

export default {
  id: "dark",
  name: "Dark",
  selectors: [".dark-mode", '[data-theme="dark"]'],
  mediaQuery: "@media (prefers-color-scheme: dark)",
  extend: theme,
};

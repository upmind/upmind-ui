import theme from "./tailwind.config.js";
import upwind from "./upwind.config.js";

export default {
  id: "retro",
  name: "Retro",
  selectors: ['[data-theme="retro"]'],
  extend: theme,
  upwind,
};

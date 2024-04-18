import theme from "./tailwind.config";
import upwind from "./upwind.config";

export default {
  id: "retro",
  name: "Retro",
  selectors: ['[data-theme="retro"]'],
  extend: theme,
  upwind,
};

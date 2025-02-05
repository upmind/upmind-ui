import theme from "./tailwind.config";
import uiConfig from "./ui.config";

export default {
  id: "retro",
  name: "Retro",
  selectors: ['[data-theme="retro"]'],
  extend: theme,
  uiConfig,
};

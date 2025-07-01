import theme from "./tailwind.config";
import uiConfig from "./ui.config";

const defaultTheme = {
  name: "upmind",
  id: "upmind",
  extend: theme,
  uiConfig,
};

export default defaultTheme;

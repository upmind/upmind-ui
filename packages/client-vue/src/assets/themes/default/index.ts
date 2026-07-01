import theme from "./_theme.css?raw";
import tokens from "./tokens.css?raw";
import uiConfig from "./ui.config";
// import WebFontLoader from "webfontloader";
// import { compact, isEmpty, uniq } from "lodash-es";

const defaultTheme = {
  name: "default",
  id: "default",
  uiConfig,
  tokens,
  theme
};

export default defaultTheme;

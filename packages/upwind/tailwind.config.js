import themer from "tailwindcss-themer";
import typography from "@tailwindcss/typography";

// --- utils
import { find, omit } from "lodash-es";

// --- Themes
import themes from "./src/assets/themes";
const defaultTheme = omit(find(themes, ["name", "Light"]), [
  "selectors",
  "mediaQuery",
]);

// -----------------------------------------------------------------------------

export default {
  darkMode: ["media", "class"], // Honour the OS preference
  content: ["./src/**/*.{html,vue,js,tsx,ts}"],
  plugins: [
    typography,
    themer({
      defaultTheme,
      themes,
    }),
    require("tailwindcss-animate"),
  ],
  theme: {},
};

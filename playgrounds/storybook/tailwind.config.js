import themer from "tailwindcss-themer";
import typography from "@tailwindcss/typography";
import aria from "tailwindcss-aria-attributes";
// --- utils
import { find, omit } from "lodash-es";

// --- Themes
import themes from "./stories/assets/themes";
const defaultTheme = omit(find(themes, ["name", "Light"]), [
  "selectors",
  "mediaQuery",
]);

// -----------------------------------------------------------------------------

export default {
  darkMode: "media", // Honour the OS preference
  content: [
    "./.storybook/**/*.{js,jsx,ts,tsx}",
    "./stories/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui/src/**/*.{html,vue,js,tsx,ts}",
  ],
  plugins: [
    typography,
    aria,
    themer({
      defaultTheme,
      themes,
    }),
  ],
};

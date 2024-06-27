import themer from "tailwindcss-themer";
import typography from "@tailwindcss/typography";

// --- Themes
import theme from "./src/assets/theme";

// -----------------------------------------------------------------------------

export default {
  darkMode: "media", // Honour the OS preference
  content: [
    "./src/**/*.{html,vue,js,tsx}",
    "../../packages/client-vue/src/**/*.{html,vue,js,tsx,ts}",
    "../../packages/upwind/src/**/*.{html,vue,js,tsx,ts}",
  ],
  plugins: [
    typography,
    themer({
      defaultTheme: theme,
      themes: [theme],
    }),
  ],
};

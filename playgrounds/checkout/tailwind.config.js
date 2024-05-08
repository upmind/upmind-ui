import themer from "tailwindcss-themer";
import typography from "@tailwindcss/typography";

// --- Themes
import theme from "./src/assets/theme";

// -----------------------------------------------------------------------------

export default {
  darkMode: "media", // Honour the OS preference
  content: [
    "./src/**/*.{html,vue,js,tsx}",
    "../../packages/client/src/**/*.{html,vue,js,tsx,ts}",
    "../../packages/upwind/src/**/*.{html,vue,js,tsx,ts}",
  ],
  theme: {
    extend: {
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            "--tw-prose-body": theme("colors.base[800]"),
            "--tw-prose-headings": theme("colors.base[900]"),
            "--tw-prose-lead": theme("colors.base[700]"),
            "--tw-prose-links": theme("colors.base[900]"),
            "--tw-prose-code": theme("colors.base[900]"),
            "--tw-prose-pre-code": theme("colors.base[100]"),
            "--tw-prose-pre-bg": theme("colors.base[900]"),
          },
        },
      }),
    },
  },
  plugins: [
    themer({
      defaultTheme: theme,
      themes: [theme],
    }),
    // ...
    typography,
  ],
};

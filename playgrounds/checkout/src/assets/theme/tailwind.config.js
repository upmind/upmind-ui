import defaultTheme from "tailwindcss/defaultTheme";

/*

Upmind Theme Configuration for Tailwind CSS
-------------------------------------------
We will ALWAYS extend the default Tailwind CSS configuration.
with our own customizations. As specified in the configuration below.

NOT all Tailwind CSS configuration options are listed here.
For a full list of options, see the official Tailwind CSS documentation: https://tailwindcss.com/docs/configuration

*/

export default {
  colors: {
    background: "#ffffff",
    foreground: "#000000",

    // ---

    base: {
      DEFAULT: "#ffffff",
      50: "#fefefe",
      100: "#f5f5f5",
      200: "#efefef",
      300: "#dcdcdc",
      400: "#bcbcbc",
      500: "#9e9e9e",
      600: "#7e7e7e",
      700: "#5e5e5e",
      800: "#3e3e3e",
      900: "#1e1e1e",
      950: "#000000",
      foreground: "#000000",
      background: "#ffffff",
    },

    control: {
      DEFAULT: "#ffffff",
      foreground: "#000000",
      active: "#5E36E8",
      error: "#EF4444",
    },

    // ---
    primary: {
      DEFAULT: "#21CB66",
      50: "#f0fdf4",
      100: "#dcfce8",
      200: "#baf8d2",
      300: "#85f0b0",
      400: "#48e086",
      500: "#21cb66",
      600: "#15a44f",
      700: "#148141",
      800: "#156637",
      900: "#13542f",
      950: "#052e18",
      foreground: "#ffffff",
    },

    secondary: {
      DEFAULT: "#5E36E8",
      50: "#f3f3ff",
      100: "#eae9fe",
      200: "#d9d7fd",
      300: "#bbb7fb",
      400: "#998ef7",
      500: "#7760f2",
      600: "#5e36e8",
      700: "#562cd5",
      800: "#4724b3",
      900: "#3d2092",
      950: "#231263",
      foreground: "#ffffff",
    },

    accent: {
      DEFAULT: "#303035",
      50: "#f7f7f8",
      100: "#eeeef0",
      200: "#d9d9de",
      300: "#b9bac0",
      400: "#92939e",
      500: "#757682",
      600: "#5e5e6b",
      700: "#4d4d57",
      800: "#42424a",
      900: "#3a3a40",
      950: "#303035",
      foreground: "#ffffff",
    },

    // ---

    promotion: {
      DEFAULT: "#5E36E8",
      50: "#f3f3ff",
      100: "#eae9fe",
      200: "#d9d7fd",
      300: "#bbb7fb",
      400: "#998ef7",
      500: "#7760f2",
      600: "#5e36e8",
      700: "#562cd5",
      800: "#4724b3",
      900: "#3d2092",
      950: "#231263",
      foreground: "#ffffff",
    },

    info: {
      DEFAULT: "#3b82f6",
      50: "#eff5ff",
      100: "#dbe8fe",
      200: "#bfd7fe",
      300: "#93bbfd",
      400: "#609afa",
      500: "#3b82f6",
      600: "#2570eb",
      700: "#1d64d8",
      800: "#1e55af",
      900: "#1e478a",
      950: "#172e54",
      foreground: "#ffffff",
    },

    success: {
      DEFAULT: "#10b981",
      50: "#ecfdf7",
      100: "#d1faec",
      200: "#a7f3da",
      300: "#6ee7bf",
      400: "#34d39e",
      500: "#10b981",
      600: "#059666",
      700: "#047852",
      800: "#065f42",
      900: "#064e36",
      950: "#022c1e",
      foreground: "#ffffff",
    },

    warning: {
      DEFAULT: "#fb923c",
      50: "#fff5ed",
      100: "#ffe8d5",
      200: "#fed0aa",
      300: "#fdb274",
      400: "#fb923c",
      500: "#f97c16",
      600: "#ea700c",
      700: "#c25e0c",
      800: "#9a4f12",
      900: "#7c4212",
      950: "#432207",
      foreground: "#fff3e0",
    },

    error: {
      DEFAULT: "#ef4444",
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d",
      950: "#450a0a",
      foreground: "#ffebee",
    },
  },

  fontFamily: {
    body: defaultTheme.fontFamily.sans.toString(","),
    display: ["Urbanist", ...defaultTheme.fontFamily.sans].toString(","),
  },

  fontSize: {
    xs: ".875rem", // 14px,
    sm: "0.938rem", //15px,
    base: "1rem", // 16px
    md: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
  },

  typography: ({ theme }) => ({
    DEFAULT: {
      css: {
        fontFamily: theme("fontFamily.body"),

        h1: {
          fontFamily: theme("fontFamily.display"),
          fontWeight: theme("fontWeight.light"),
          fontSize: theme("fontSize.5xl"),
        },
        h2: {
          fontFamily: theme("fontFamily.display"),
        },
        h3: {
          fontFamily: theme("fontFamily.display"),
        },
        h4: {
          fontFamily: theme("fontFamily.display"),
        },
        h5: {
          fontFamily: theme("fontFamily.display"),
        },
        h6: {
          fontFamily: theme("fontFamily.display"),
        },
      },
    },
  }),
};

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
    transparent: "transparent",
    black: "#000000",
    white: "#ffffff",

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
      content: "#000000",
    },

    gray: {
      DEFAULT: "#6d6d6d",
      50: "#f6f6f6",
      100: "#e7e7e7",
      200: "#d1d1d1",
      300: "#b0b0b0",
      400: "#888888",
      500: "#6d6d6d",
      600: "#5d5d5d",
      700: "#4f4f4f",
      800: "#424242",
      900: "#3d3d3d",
      950: "#262626",
      content: "#e7e7e7",
    },

    // ---
    primary: {
      DEFAULT: "#018ffd",
      50: "#edfbff",
      100: "#d6f5ff",
      200: "#b6f0ff",
      300: "#83e9ff",
      400: "#49daff",
      500: "#1fbfff",
      600: "#07a3ff",
      700: "#018ffd",
      800: "#086dc5",
      900: "#0e5c9a",
      950: "#0e385d",
      content: "#ffffff",
    },

    secondary: {
      DEFAULT: "#05c3de",
      50: "#ecfeff",
      100: "#cffbfe",
      200: "#a4f5fd",
      300: "#66ecfa",
      400: "#21d8ef",
      500: "#05c3de",
      600: "#0796b3",
      700: "#0d7791",
      800: "#146076",
      900: "#165063",
      950: "#083444",
      content: "#ffffff",
    },

    accent: {
      DEFAULT: "#8b04de",
      50: "#fbf3ff",
      100: "#f5e4ff",
      200: "#edceff",
      300: "#dfa7ff",
      400: "#cc6fff",
      500: "#ba39ff",
      600: "#a913ff",
      700: "#8b04de",
      800: "#7c0abf",
      900: "#66099a",
      950: "#470074",
      content: "#ffffff",
    },

    neutral: {
      DEFAULT: "#2b4779",
      50: "#f4f6fb",
      100: "#e8ecf6",
      200: "#cbd8ec",
      300: "#9db6dc",
      400: "#6990c7",
      500: "#4672b1",
      600: "#345995",
      700: "#2b4779",
      800: "#273e65",
      900: "#253555",
      950: "#111827",
      content: "#f4f6fb",
    },

    // ---

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
      content: "#ffffff",
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
      content: "#ffffff",
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
      content: "#fff3e0",
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
      content: "#ffebee",
    },

    disabled: {
      DEFAULT: "#9e9e9e",
      content: "#eeeeee",
    },
    // ---
  },

  fontFamily: {
    sans: ["Inter", "sans-serif", ...defaultTheme.fontFamily.sans],
    serif: ["Inter", "sans-serif", ...defaultTheme.fontFamily.serif],
    mono: ["Inconsolata", "monospace", ...defaultTheme.fontFamily.mono],
  },

  fontSize: {
    xs: ".75rem", // 12px
    sm: ".875rem", // 14px
    base: "1rem", // 16px
    md: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
  },
  // ---------------------------------------------------------------------------
  typography: ({ theme }) => ({
    DEFAULT: {
      css: {
        h1: {
          fontWeight: theme("fontWeight.light"),
          fontSize: theme("fontSize.5xl"),
          color: "red",
        },
      },
    },
  }),
};

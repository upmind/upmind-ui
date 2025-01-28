import type { Config } from "tailwindcss";
import type { PluginUtils } from "tailwindcss/types/config";
// ---

import defaultTheme from "tailwindcss/defaultTheme";

// -----------------------------------------------------------------------------
// Dark theme
// -----------------------------------------------------------------------------

const colors = {
  background: "#000000",
  foreground: "#ffffff",

  // --- Theme Variants

  base: {
    DEFAULT: "#000000",
    50: "#000000",
    100: "#1e1e1e",
    200: "#3e3e3e",
    300: "#5e5e5e",
    400: "#7e7e7e",
    500: "#9e9e9e",
    600: "#bcbcbc",
    700: "#dcdcdc",
    800: "#efefef",
    900: "#f5f5f5",
    950: "#fefefe",
    foreground: "#ffffff",
    background: "#000000",
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
    foreground: "#ffffff",
    background: "#018ffd",
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
    foreground: "#ffffff",
    background: "#05c3de",
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
    foreground: "#ffffff",
    background: "#8b04de",
  },

  // --- State Variants
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
    background: "#5E36E8",
  },

  destructive: {
    DEFAULT: "#ff4d6d",
    50: "#300313",
    100: "#4c0519",
    200: "#7f172b",
    300: "#9f1239",
    400: "#be123c",
    500: "#e11d48",
    600: "#f43f5e",
    700: "#ff4d6d",
    800: "#fda4af",
    900: "#fecdd3",
    950: "#fff1f2",
    foreground: "#ffffff",
    background: "#ff4d6d",
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
    background: "#3b82f6",
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
    background: "#10b981",
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
    background: "#fb923c",
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
    background: "#ef4444",
  },

  disabled: {
    DEFAULT: "#9e9e9e",
    foreground: "#eeeeee",
  },

  muted: {
    DEFAULT: "#f1f5f9",
    foreground: "#65758b",
  },

  // --- Component Variants

  card: {
    DEFAULT: "#ffffff",
    foreground: "#0f1729",
  },

  popover: {
    DEFAULT: "#ffffff",
    foreground: "#0f1729",
  },

  control: {
    DEFAULT: "#ffffff",
    foreground: "#000000",
    active: "#5E36E8",
    error: "#EF4444",
  },
};

// -----------------------------------------------------------------------------

export default {
  content: [],
  colors,
  fontFamily: {
    sans: ["Inter", ...defaultTheme.fontFamily.sans].toString(),
    serif: ["Inter", ...defaultTheme.fontFamily.serif].toString(),
    mono: ["Inconsolata", ...defaultTheme.fontFamily.mono].toString(),
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

  width: {
    "dropdown-3xs": "6rem",
    "dropdown-2xs": "8rem",
    "dropdown-xs": "10rem",
    "dropdown-sm": "12rem",
    "dropdown-md": "14rem",
    "dropdown-lg": "16rem",
    "dropdown-xl": "18rem",
    "dropdown-2xl": "20rem",
  },
  leading: {
    none: 1,
    tight: 1.25,
    normal: 1.5,
    loose: 2,
  },
  tracking: {
    tight: "-0.05em",
    normal: "0",
    wide: "0.05em",
  },
  borderColor: {
    DEFAULT: colors.base[300],
    input: colors.base[300],
  },
  borderRadius: {
    DEFAULT: ".5rem",
    none: "0",
    xs: ".0625rem", // 1px
    sm: ".125rem", // 2px
    md: ".25rem", // 4px
    lg: ".5rem", // 8px
    xl: "1rem", // 16px
    full: "9999px", // 9999px,
    pill: "10em", // 9999px,
    button: ".25rem", // 4px,
    box: ".5rem", // 8px,
  },
  shadows: {
    default: "0 2px 4px 0 rgba(0,0,0,0.10)",
    md: "0 4px 8px 0 rgba(0,0,0,0.12), 0 2px 4px 0 rgba(0,0,0,0.08)",
    lg: "0 15px 30px 0 rgba(0,0,0,0.11), 0 5px 15px 0 rgba(0,0,0,0.08)",
    inner: "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
    outline: "0 0 0 3px rgba(52,144,220,0.5)",
    none: "none",
  },
  ringColor: {
    DEFAULT: colors.control.active,
  },
  typography: ({ theme }: PluginUtils) => ({
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
} satisfies Config;

import type { Config } from "tailwindcss";
import type { PluginUtils } from "tailwindcss/types/config";
// ---
import defaultTheme from "tailwindcss/defaultTheme";

// -----------------------------------------------------------------------------

const colors = {
  foreground: "#282425",
  background: "#ece3ca",

  // --- Theme Variants

  base: {
    DEFAULT: "#f4efe0",
    50: "#faf8f2",
    100: "#f4efe0",
    200: "#ece3ca",
    300: "#dac697",
    400: "#caaa6d",
    500: "#be9451",
    600: "#b18045",
    700: "#93673b",
    800: "#775335",
    900: "#61442d",
    950: "#342316",
    foreground: "#775335",
    background: "#f4efe0",
    muted: {
      DEFAULT: "#f4efe0",
      foreground: "#65758b",
      active: "#ece3ca",
    },
  },

  primary: {
    DEFAULT: "#df5a54",
    50: "#fdf3f3",
    100: "#fbe6e5",
    200: "#f9d1cf",
    300: "#f4b0ad",
    400: "#ef9995",
    500: "#df5a54",
    600: "#cb3e37",
    700: "#aa312b",
    800: "#8d2c27",
    900: "#762a26",
    950: "#40110f",
    foreground: "#282425",
    background: "#df5a54",
    muted: {
      DEFAULT: "#fbe6e5",
      foreground: "#65758b",
      active: "#f9d1cf",
    },
  },

  accent: {
    DEFAULT: "#448562",
    50: "#f1f8f4",
    100: "#deede2",
    200: "#bfdbc9",
    300: "#a4cbb4",
    400: "#65a280",
    500: "#448562",
    600: "#32694d",
    700: "#285440",
    800: "#224334",
    900: "#1c382b",
    950: "#0f1f18",
    foreground: "#f1f8f4",
    background: "#448562",
    muted: {
      DEFAULT: "#deede2",
      foreground: "#65758b",
      active: "#bfdbc9",
    },
  },

  secondary: {
    DEFAULT: "#903710",
    50: "#fffaeb",
    100: "#fdeec8",
    200: "#fbdb84",
    300: "#f9c650",
    400: "#f8b027",
    500: "#f18d0f",
    600: "#d66909",
    700: "#b1480c",
    800: "#903710",
    900: "#762e11",
    950: "#441604",
    foreground: "#fffaeb",
    background: "#903710",
    muted: {
      DEFAULT: "#fdeec8",
      foreground: "#65758b",
      active: "#fbdb84",
    },
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
    background: "#5E36E8",
    muted: {
      DEFAULT: "#f3f3ff",
      foreground: "#65758b",
      active: "#eae9fe",
    },
  },

  destructive: {
    DEFAULT: "#ff6b6b",
    50: "#4d0000",
    100: "#660000",
    200: "#990000",
    300: "#cc0000",
    400: "#ff0000",
    500: "#ff3333",
    600: "#ff6666",
    700: "#ff9999",
    800: "#ffcccc",
    900: "#ffe5e5",
    950: "#fff2f2",
    foreground: "#ffffff",
    background: "#ff4d6d",
    muted: {
      DEFAULT: "#4d0000",
      foreground: "#65758b",
      active: "#660000",
    },
  },

  // ---

  info: {
    DEFAULT: "#2563eb",
    50: "#eff4ff",
    100: "#dbe6fe",
    200: "#bfd3fe",
    300: "#93b4fd",
    400: "#6090fa",
    500: "#3b76f6",
    600: "#2563eb",
    700: "#1d58d8",
    800: "#1e4baf",
    900: "#1e408a",
    950: "#172a54",
    foreground: "#dbe6fe",
    background: "#2563eb",
    muted: {
      DEFAULT: "#eff4ff",
      foreground: "#65758b",
      active: "#bfd3fe",
    },
  },

  success: {
    DEFAULT: "#16a34a",
    50: "#f0fdf5",
    100: "#dcfce8",
    200: "#bbf7d1",
    300: "#86efad",
    400: "#4ade81",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803c",
    800: "#166533",
    900: "#14532b",
    950: "#052e14",
    foreground: "#dcfce8",
    background: "#16a34a",
    muted: {
      DEFAULT: "#f0fdf5",
      foreground: "#65758b",
      active: "#bbf7d1",
    },
  },

  warning: {
    DEFAULT: "#d97706",
    50: "#fff6eb",
    100: "#fee4c7",
    200: "#fdc88a",
    300: "#fcab4d",
    400: "#fb9724",
    500: "#f5880b",
    600: "#d97706",
    700: "#b46509",
    800: "#92550e",
    900: "#78470f",
    950: "#452603",
    foreground: "#fee4c7",
    background: "#d97706",
    muted: {
      DEFAULT: "#fff6eb",
      foreground: "#65758b",
      active: "#fdc88a",
    },
  },

  error: {
    DEFAULT: "#f35248",
    50: "#fef3f2",
    100: "#ffe3e1",
    200: "#ffccc9",
    300: "#fea8a3",
    400: "#fb766e",
    500: "#f35248",
    600: "#e02d22",
    700: "#bc2319",
    800: "#9c2018",
    900: "#81211b",
    950: "#460d09",
    foreground: "#ffe3e1",
    background: "#f35248",
    muted: {
      DEFAULT: "#fef3f2",
      foreground: "#65758b",
      active: "#ffccc9",
    },
  },

  disabled: {
    DEFAULT: "#bdbdbd",
    foreground: "#404040",
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
    background: "#ffffff",
    active: {
      DEFAULT: "#5E36E8",
      muted: "#5E36E820",
      foreground: "#ffffff",
      background: "#5E36E8",
    },
    error: {
      DEFAULT: "#EF4444",
      muted: "#EF444420",
      foreground: "#ffffff",
      background: "#EF4444",
    },
  },
};

// -----------------------------------------------------------------------------

export default {
  content: [],
  colors,
  fontFamily: {
    sans: [
      "Inconsolata",
      "monospace",
      ...defaultTheme.fontFamily.sans,
    ].toString(),
    serif: [
      "Inconsolata",
      "monospace",
      ...defaultTheme.fontFamily.serif,
    ].toString(),
    mono: [
      "Inconsolata",
      "monospace",
      ...defaultTheme.fontFamily.mono,
    ].toString(),
  },
  textSizes: {
    xs: ".75rem", // 12px
    sm: ".875rem", // 14px
    base: "1rem", // 16px
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
    control: colors.base[300],
    active: colors.control.active.DEFAULT,
  },
  borderRadius: {
    DEFAULT: "0", // disabled
    none: "0", // disabled
    xs: "0", // disabled
    sm: "0", // disabled
    md: "0", // disabled
    lg: "0", // disabled
    xl: "0", // disabled
    full: "0", // disabled
    pill: "0", // disabled
    button: "0", // disabled
    box: "0", // disabled
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
    DEFAULT: colors.control.active.muted,
    ring: colors.control.active.muted,
    invalid: colors.control.error.muted,
    active: colors.control.active.DEFAULT,
  },
} satisfies Config;

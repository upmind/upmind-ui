import type { Config } from "tailwindcss";
import type { PluginUtils } from "tailwindcss/types/config";

// ---
import defaultTheme from "tailwindcss/defaultTheme";

// -----------------------------------------------------------------------------

const colors = {
  transparent: "transparent",
  black: "#121212",
  white: "#FFFFFF",
  background: "var(--background-canvas)",
  foreground: "var(--foreground)",
  border: "var(--border)",

  base: {
    DEFAULT: "var(--background-surface)",
    foreground: "var(--foreground)",
    background: "var(--background-surface)",
    ring: "var(--ring)",
    muted: {
      foreground: "var(--muted-foreground)",
    },
  },

  primary: {
    DEFAULT: "var(--primary)",
    foreground: "var(--primary-foreground)",
    background: {
      DEFAULT: "var(--primary-background)",
      hover: "var(--primary-background-hover)",
    },
    muted: {
      DEFAULT: "var(--primary-muted)",
      hover: {
        DEFAULT: "var(--primary-muted-hover)",
        foreground: "var(--primary-muted-hover-foreground)",
      },
      foreground: "var(--primary-muted-foreground)",
    },
    ring: "var(--ring-primary-ring, var(--primary))",
  },

  secondary: {
    DEFAULT: "var(--secondary)",
    foreground: "var(--secondary-foreground)",
    background: {
      DEFAULT: "var(--secondary-background)",
      hover: "var(--secondary-background-hover)",
    },
    muted: {
      DEFAULT: "var(--secondary-muted)",
      hover: {
        DEFAULT: "var(--secondary-muted-hover)",
        foreground: "var(--secondary-muted-hover-foreground)",
      },
      foreground: "var(--primary-muted-foreground)",
    },
    ring: "var(--ring-secondary-ring, var(--secondary))",
  },

  tertiary: {
    DEFAULT: "#ffa4ea",
    50: "#fff4fd",
    100: "#ffe7fb",
    200: "#ffcef5",
    300: "#ffa4ea",
    400: "#fe74dd",
    500: "#f540c7",
    600: "#d920a7",
    700: "#b41787",
    800: "#93156c",
    900: "#781758",
    950: "#510138",
    foreground: "#021831",
    background: "#ffa4ea",
    muted: {
      DEFAULT: "#ffe7fb",
      foreground: "#fe74dd",
      active: "#ffcef5",
    },
  },

  quarternary: {
    DEFAULT: "#ffe900",
    50: "#fdffe7",
    100: "#f9ffc1",
    200: "#f8ff86",
    300: "#fcff41",
    400: "#fff70d",
    500: "#ffe900",
    600: "#d1ad00",
    700: "#a67d02",
    800: "#89610a",
    900: "#744f0f",
    950: "#442a04",

    foreground: "#442a04",
    background: "#ffe900",
    muted: {
      DEFAULT: "#f9ffc1",
      foreground: "#fff70d",
      active: "#f8ff86",
    },
  },

  accent: {
    DEFAULT: "#24eda0",
    50: "#CEFBEA",
    100: "#BBF9E1",
    200: "#95F6D1",
    300: "#6FF3C1",
    400: "#4AF0B0",
    500: "#24EDA0",
    600: "#10C882",
    700: "#0C9560",
    800: "#08613F",
    900: "#042D1D",
    950: "#02130C",
    foreground: "#16272d",
    background: "#24eda0",
    muted: {
      DEFAULT: "#24eda0",
      foreground: "#16272d",
      active: "#24eda0",
    },
  },

  promotion: {
    DEFAULT: "#24eda0",
    50: "#CEFBEA",
    100: "#BBF9E1",
    200: "#95F6D1",
    300: "#6FF3C1",
    400: "#4AF0B0",
    500: "#24EDA0",
    600: "#10C882",
    700: "#0C9560",
    800: "#08613F",
    900: "#042D1D",
    950: "#02130C",
    foreground: "#16272d",
    background: "#24eda0",
    muted: {
      DEFAULT: "#24eda0",
      foreground: "#16272d",
      active: "#24eda0",
    },
  },

  destructive: {
    DEFAULT: "#e11d48",
    50: "#fff1f2",
    100: "#ffe4e6",
    200: "#fecdd3",
    300: "#fda4af",
    400: "#fb7185",
    500: "#f43f5e",
    600: "#e11d48",
    700: "#be123c",
    800: "#9f1239",
    900: "#881337",
    950: "#4c0519",
    foreground: "#ffffff",
    background: "#ff4d6d",
    muted: {
      DEFAULT: "#fff1f2",
      foreground: "#fb7185",
      active: "#fecdd3",
    },
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
    muted: {
      DEFAULT: "#eff5ff",
      foreground: "#609afa",
      active: "#dbe8fe",
    },
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
    muted: {
      DEFAULT: "#ecfdf7",
      foreground: "#34d39e",
      active: "#a7f3da",
    },
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
    muted: {
      DEFAULT: "#fff5ed",
      foreground: "#fdb274",
      active: "#ffe8d5",
    },
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
    muted: {
      DEFAULT: "#fef2f2",
      foreground: "#f87171",
      active: "#fee2e2",
    },
  },

  card: {
    DEFAULT: "#ffffff",
    foreground: "#0f1729",
  },

  popover: {
    DEFAULT: "var(--control-popover)",
    foreground: "var(--control-foreground)",
  },

  control: {
    DEFAULT: "var(--control)",
    background: "var(--control-background)",
    foreground: "var(--control-foreground)",
    border: "var(--control-border)",
    hover: {
      border: "var(--control-hover-border)",
    },
    active: {
      DEFAULT: "var(--control-active)",
      muted: "var(--control-active-muted)",
      foreground: "var(--control-active-foreground)",
      background: "var(--control-active-background)",
      hover: "var(--control-active-hover)",
      focus: "var(--control-active-focus)",
    },
    error: {
      DEFAULT: "#EF4444",
      muted: "#EF444420",
      foreground: "#ffffff",
      background: "#EF4444",
    },
  },

  icon: {
    primary: "var(--icon-primary)",
    secondary: "var(--icon-secondary)",
  },
};

// -----------------------------------------------------------------------------

export default {
  content: [],
  colors,
  fontFamily: {
    sans: ["Inter Tight", ...defaultTheme.fontFamily.sans].toString(),
    serif: ["Inter Tight", ...defaultTheme.fontFamily.serif].toString(),
    mono: ["Inconsolata", ...defaultTheme.fontFamily.mono].toString(),
  },
  // Allows us to use gradients
  // backgroundImage: {
  //   primary: "var(--primary)",
  //   secondary: "var(--secondary)",
  // },
  fontSize: {
    "2xs": ".75rem", // 12px
    xs: ".875rem", // 14px
    sm: ".9375rem", // 15px
    md: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
  },
  width: {
    app: "1280px",
    "dropdown-3xs": "6rem",
    "dropdown-2xs": "8rem",
    "dropdown-xs": "10rem",
    "dropdown-sm": "12rem",
    "dropdown-md": "14rem",
    "dropdown-lg": "16rem",
    "dropdown-xl": "18rem",
    "dropdown-2xl": "20rem",
  },
  maxWidth: {
    app: "1280px",
  },
  minWidth: {
    app: "1280px",
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
    DEFAULT: "var(--border)",
  },
  borderRadius: {
    DEFAULT: ".5rem",
    none: "0",
    xs: ".0625rem", // 1px
    sm: ".125rem", // 2px
    md: ".25rem", // 4px
    lg: ".5rem", // 8px
    xl: "58px", // 16px
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

  // borderWidth: {
  //   DEFAULT: "2px",
  // },
  // shadow: {
  //   default: "0",
  //   sm: "0",
  //   md: "0",
  //   lg: "0",
  //   xl: "0",
  //   "2xl": "0",
  //   inner: "0",
  //   outline: "0",
  // },

  // boxShadow: {
  //   sm: "0 0px 0px 0px rgba(255, 255, 255, 0)",
  // },

  ringColor: {
    DEFAULT: colors.control.active,
    ring: colors.control.active,
    invalid: colors.control.error.muted,
  },
  typography: ({ theme }: PluginUtils) => ({
    DEFAULT: {
      css: {
        fontFamily: theme("fontFamily.body"),

        h1: {
          fontFamily: theme("fontFamily.display"),
          fontWeight: 700,
          lineHeight: 1.2,
          color: "var(--foreground)",
        },
        h2: {
          fontFamily: theme("fontFamily.display"),
          fontWeight: 700,
          lineHeight: 1.2,
          color: "var(--foreground)",
        },
        h3: {
          fontFamily: theme("fontFamily.display"),
          fontWeight: 700,
          lineHeight: 1.2,
          color: "var(--foreground)",
        },
        h4: {
          fontFamily: theme("fontFamily.display"),
          fontWeight: 500,
          lineHeight: 1.2,
          color: "var(--foreground)",
        },
        h5: {
          fontFamily: theme("fontFamily.display"),
          fontWeight: 500,
          lineHeight: 1.2,
          color: "var(--foreground)",
        },
        h6: {
          fontFamily: theme("fontFamily.display"),
          fontWeight: 500,
          lineHeight: 1.2,
          color: "var(--foreground)",
        },
      },
    },
  }),
  textColor: {
    emphasis: {
      disabled: "color-mix(in srgb, currentColor 38%, transparent)",
      medium: "color-mix(in srgb, currentColor 60%, transparent)",
      high: "color-mix(in srgb, currentColor 87%, transparent)",
      none: "currentColor",
    },
  },
} satisfies Config;

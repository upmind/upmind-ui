import type { Config } from "tailwindcss";
import type { PluginUtils } from "tailwindcss/types/config";

// ---
import defaultTheme from "tailwindcss/defaultTheme";

// -----------------------------------------------------------------------------

const colors = {
  transparent: "transparent",
  black: "#021831",
  white: "#ffffff",
  background: "var(--background-canvas,#F8F8FB)",
  foreground: "var(--foreground,#121217)",

  // --- Theme Variants

  base: {
    DEFAULT: "var(--background-surface,#FFFFFF)",
    50: "#fbfcfd",
    100: "#f9fafb",
    200: "#dde3e8",
    300: "#c7d1da",
    400: "#b0bbc9",
    500: "#919eb2",
    600: "#858fa6",
    700: "#727b90",
    800: "#5d6476",
    900: "#4f5560",
    950: "#2e3138",
    foreground: "var(--foreground,#121217)",
    background: "var(--background-surface,#FFFFFF)",
    muted: {
      DEFAULT: "#F8F8FB",
      foreground: "var(--muted-foreground,#121217)",
      active: "var(--primary,#FA2F62)"
    }
  },

  primary: {
    DEFAULT: "var(--primary,#FA2F62)",
    200: "#AFFFDC",
    300: "#70FFC3",
    400: "#46FDAE",
    500: "#00E784",
    600: "#00C069",
    700: "#009656",
    800: "#067547",
    900: "#0D493D",
    950: "#02183180",
    foreground: "var(--primary-foreground,#FFFFFF)",
    background: "var(--primary-background,#FA2F62)",
    muted: {
      DEFAULT: "var(--primary-muted,#EAEAF1)",
      foreground: "var(--primary-muted-foreground,#EAEAF1)",
      active: "#D5FFEE"
    }
  },

  secondary: {
    DEFAULT: "var(--secondary,#794DFF)",
    200: "#AFFFDC",
    300: "#70FFC3",
    400: "#46FDAE",
    500: "#00E784",
    600: "#00C069",
    700: "#009656",
    800: "#067547",
    900: "#0D493D",
    950: "#003720",
    foreground: "var(--secondary-foreground,#FFFFFF)",
    background: "var(--secondary-background,#794DFF)",
    muted: {
      DEFAULT: "var(--secondary-muted,#EAEAF1)",
      foreground: "var(--secondary-muted-foreground,#EAEAF1)",
      active: "#D5FFEE"
    }
  },

  // pink
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
      active: "#ffcef5"
    }
  },

  // yellow
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
      active: "#f8ff86"
    }
  },

  // green
  accent: {
    DEFAULT: "#bbff6f",
    50: "#f5ffe5",
    100: "#e8ffc7",
    200: "#d1ff95",
    300: "#bbff6f",
    400: "#91f625",
    500: "#94D80A",
    600: "#54b100",
    700: "#408605",
    800: "#36690b",
    900: "#2e590e",
    950: "#153201",
    foreground: "#153201",
    background: "#bbff6f",
    muted: {
      DEFAULT: "#e8ffc7",
      foreground: "#91f625",
      active: "#d1ff95"
    }
  },

  // --- State Variants
  promotion: {
    DEFAULT: "var(--promotion,#f540c7)",
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
    foreground: "var(--promotion-foreground,#FFFFFF)",
    background: "var(--promotion-background,#f540c7)",
    muted: {
      DEFAULT: "var(--promotion-muted,#f540c7)",
      foreground: "var(--promotion-muted-foreground,#ffe7fb)",
      active: "var(--promotion-muted-active,#f540c7)"
    }
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
      active: "#fecdd3"
    }
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
      active: "#dbe8fe"
    }
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
      active: "#a7f3da"
    }
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
      active: "#ffe8d5"
    }
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
      active: "#fee2e2"
    }
  },

  disabled: {
    DEFAULT: "#9e9e9e",
    foreground: "#eeeeee"
  },

  // --- Component Variants

  card: {
    DEFAULT: "#ffffff",
    foreground: "#0f1729"
  },

  popover: {
    DEFAULT: "var(--control-popover,#FFFFFF)",
    foreground: "var(--control-foreground,#121217)"
  },

  control: {
    DEFAULT: "var(--control,#FFFFFF)",
    background: "var(--control-background,#FFFFFF)",
    foreground: "var(--control-foreground,#121217)",
    active: {
      DEFAULT: "var(--control-active,#FA2F62)",
      muted: "var(--control-active-muted,#F8F8FB)",
      foreground: "var(--control-active-foreground,#FFFFFF)",
      background: "var(--control-active-background,#FA2F62)",
      hover: "var(--control-active-hover,#FA2F6215)",
      focus: "var(--control-active-focus,#FA2F6215)"
    },
    error: {
      DEFAULT: "#EF4444",
      muted: "#EF444420",
      foreground: "#ffffff",
      background: "#EF4444"
    }
  },

  icon: {
    primary: "var(--icon-primary,#121217)",
    secondary: "var(--icon-secondary,#121217)"
  }
};

// -----------------------------------------------------------------------------

export default {
  content: [],
  colors,
  fontFamily: {
    sans: "var(--fontFamily, ui-sans-serif, system-ui, sans-serif)",
    body: "var(--fontFamily, ui-sans-serif, system-ui, sans-serif)",
    display: "var(--fontFamily, ui-sans-serif, system-ui, sans-serif)"
  },
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
    "5xl": "3rem" // 48px
  },
  width: {
    "dropdown-3xs": "6rem",
    "dropdown-2xs": "8rem",
    "dropdown-xs": "10rem",
    "dropdown-sm": "12rem",
    "dropdown-md": "14rem",
    "dropdown-lg": "16rem",
    "dropdown-xl": "18rem",
    "dropdown-2xl": "20rem"
  },
  maxWidth: {
    app: "clamp(320px, 90%, 1280px)"
  },
  leading: {
    none: 1,
    tight: 1.25,
    normal: 1.5,
    loose: 2
  },
  tracking: {
    tight: "-0.05em",
    normal: "0",
    wide: "0.05em"
  },
  borderColor: {
    DEFAULT: "rgb(0 25 51 / 0.1)",
    input: "rgb(0 25 51 / 0.1)",
    control: {
      DEFAULT: "rgb(0 25 51 / 0.1)",
      strong: "rgb(0 25 51 / 0.2)"
    }
  },
  borderRadius: {
    DEFAULT: ".5rem",
    none: "0",
    xl: "12px",
    lg: "8px",
    md: "6px",
    sm: "4px",
    full: "99999px",
    pill: "10em",
    button: ".25rem",
    box: ".5rem"
  },
  shadows: {
    default: "0 2px 4px 0 rgba(0,0,0,0.10)",
    md: "0 4px 8px 0 rgba(0,0,0,0.12), 0 2px 4px 0 rgba(0,0,0,0.08)",
    lg: "0 15px 30px 0 rgba(0,0,0,0.11), 0 5px 15px 0 rgba(0,0,0,0.08)",
    inner: "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
    outline: "0 0 0 3px rgba(52,144,220,0.5)",
    none: "none"
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
    invalid: colors.control.error.muted
  },
  typography: ({ theme }: PluginUtils) => ({
    DEFAULT: {
      css: {
        fontFamily: theme("fontFamily.body"),

        h1: {
          fontFamily: theme("fontFamily.display"),
          fontWeight: 700,
          lineHeight: 1.2
        },
        h2: {
          fontFamily: theme("fontFamily.display"),
          fontWeight: 700,
          lineHeight: 1.2
        },
        h3: {
          fontFamily: theme("fontFamily.display"),
          fontWeight: 700,
          lineHeight: 1.2
        },
        h4: {
          fontFamily: theme("fontFamily.display"),
          fontWeight: 500,
          lineHeight: 1.2
        },
        h5: {
          fontFamily: theme("fontFamily.display"),
          fontWeight: 500,
          lineHeight: 1.2
        },
        h6: {
          fontFamily: theme("fontFamily.display"),
          fontWeight: 500,
          lineHeight: 1.2
        }
      }
    }
  }),
  textColor: {
    emphasis: {
      disabled: "color-mix(in srgb, currentColor 38%, transparent)",
      medium: "color-mix(in srgb, currentColor 60%, transparent)",
      high: "color-mix(in srgb, currentColor 75%, transparent)",
      none: "currentColor"
    }
  }
} satisfies Config;

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
  /*
|-------------------------------------------------------------------------------
| Colors                                    https://tailwindcss.com/docs/colors
|-------------------------------------------------------------------------------
|
| Here you can specify the colors used in your project.
| We generally dont specify colors here, only the theme colors. eg: primary, secondary, tertiary, accent
| To get you started, we've provided our base palette of great looking colors that are perfect
| for your Upmind store, but don't hesitate to change them for your project.
| You own these colors, nothing will break if you change everything about them.
|
*/

  colors: {
    background: "#ffffff",
    foreground: "#000000",

    //
    muted: {
      DEFAULT: "#f1f5f9",
      foreground: "#65758b",
    },

    card: {
      DEFAULT: "#ffffff",
      foreground: "#0f1729",
    },

    popover: {
      DEFAULT: "#ffffff",
      foreground: "#0f1729",
    },

    destructive: {
      DEFAULT: "#ff0000",
      foreground: "#f8fafc",
    },

    //
    border: "214.3 31.8% 91.4%;",
    input: "214.3 31.8% 91.4%;",
    control: {
      DEFAULT: "#ffffff",
      forground: "#000000",
      active: "#5E36E8",
      error: "#EF4444",
    },

    ring: "215 20.2% 65.1%;",
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
      forground: "#000000",
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
      forground: "#ffffff",
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
      forground: "#ffffff",
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
      forground: "#ffffff",
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
      forground: "#ffffff",
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
      forground: "#ffffff",
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
      forground: "#ffffff",
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
      forground: "#fff3e0",
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
      forground: "#ffebee",
    },

    disabled: {
      DEFAULT: "#9e9e9e",
      forground: "#eeeeee",
    },
    // ---
  },

  /*
  |-----------------------------------------------------------------------------
  | Fonts                                    https://tailwindcss.com/docs/fonts
  |-----------------------------------------------------------------------------
  |
  | Here is where you define your project's font stack, or font families.
  | Keep in mind that Tailwind doesn't actually load any fonts for you.
  | If you're using custom fonts you'll need to import them prior to
  | defining them here.
  |
  | By default we provide a native font stack that works remarkably well on
  | any device or OS you're using, since it just uses the default fonts
  | provided by the platform.
  |
  | Class name: .font-{name}
  |
  */

  fontFamily: {
    sans: ["Inter", "sans-serif", ...defaultTheme.fontFamily.sans],
    serif: ["Inter", "sans-serif", ...defaultTheme.fontFamily.serif],
    mono: ["Inconsolata", "monospace", ...defaultTheme.fontFamily.mono],
  },

  // fontFamily: {
  //   sans: ["Courier New", "monospace"],
  //   serif: ["Courier New", "monospace"],
  //   mono: ["Courier New", "monospace"],
  // },

  /*
  |-----------------------------------------------------------------------------
  | Text sizes                         https://tailwindcss.com/docs/text-sizing
  |-----------------------------------------------------------------------------
  |
  | Here is where you define your text sizes. Name these in whatever way
  | makes the most sense to you. We use size names by default, but
  | you're welcome to use a numeric scale or even something else
  | entirely.
  |
  | By default Tailwind uses the "rem" unit type for most measurements.
  | This allows you to set a root font size which all other sizes are
  | then based on. That said, you are free to use whatever units you
  | prefer, be it rems, ems, pixels or other.
  |
  | Class name: .text-{size}
  |
  */

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

  /*
  |-----------------------------------------------------------------------------
  | Leading (line height)              https://tailwindcss.com/docs/line-height
  |-----------------------------------------------------------------------------
  |
  | Here is where you define your line height values, or as we call
  | them in Tailwind, leadings.
  |
  | Class name: .leading-{size}
  |
  */

  leading: {
    none: 1,
    tight: 1.25,
    normal: 1.5,
    loose: 2,
  },

  /*
  |-----------------------------------------------------------------------------
  | Tracking (letter spacing)       https://tailwindcss.com/docs/letter-spacing
  |-----------------------------------------------------------------------------
  |
  | Here is where you define your letter spacing values, or as we call
  | them in Tailwind, tracking.
  |
  | Class name: .tracking-{size}
  |
  */

  tracking: {
    tight: "-0.05em",
    normal: "0",
    wide: "0.05em",
  },

  /*
  |-----------------------------------------------------------------------------
  | Border radius                    https://tailwindcss.com/docs/border-radius
  |-----------------------------------------------------------------------------
  |
  | Here is where you define your border radius values. If a `default` radius
  | is provided, it will be made available as the non-suffixed `.rounded`
  | utility.
  |
  | If your scale includes a `0` value to reset already rounded corners, it's
  | a good idea to put it first so other values are able to override it.
  |
  | Class name: .rounded{-side?}{-size?}
  |
  */

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

  /*
  |-----------------------------------------------------------------------------
  | Shadows                                https://tailwindcss.com/docs/shadows
  |-----------------------------------------------------------------------------
  |
  | Here is where you define your shadow utilities. As you can see from
  | the defaults we provide, it's possible to apply multiple shadows
  | per utility using comma separation.
  |
  | If a `default` shadow is provided, it will be made available as the non-
  | suffixed `.shadow` utility.
  |
  | Class name: .shadow-{size?}
  |
  */

  shadows: {
    default: "0 2px 4px 0 rgba(0,0,0,0.10)",
    md: "0 4px 8px 0 rgba(0,0,0,0.12), 0 2px 4px 0 rgba(0,0,0,0.08)",
    lg: "0 15px 30px 0 rgba(0,0,0,0.11), 0 5px 15px 0 rgba(0,0,0,0.08)",
    inner: "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
    outline: "0 0 0 3px rgba(52,144,220,0.5)",
    none: "none",
  },
};

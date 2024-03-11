/*

Upmind Theme Configuration for Tailwind CSS
-------------------------------------------
We will ALWAYS extend the default Tailwind CSS configuration.
with our own customizations. As specified in the configuration below.

NOT all Tailwind CSS configuration options are listed here.
For a full list of options, see the official Tailwind CSS documentation: https://tailwindcss.com/docs/configuration

*/

/*
|-------------------------------------------------------------------------------
| Colors                                    https://tailwindcss.com/docs/colors
|-------------------------------------------------------------------------------
|
| Here you can specify the colors used in your project.
| We generally dont specify colors here, only the theme colors. eg: primary, secondary, tertiary, accent, neutral
| To get you started, we've provided our base palette of great looking colors that are perfect
| for your Upmind store, but don't hesitate to change them for your project.
| You own these colors, nothing will break if you change everything about them.
|
*/

import defaultTheme from "tailwindcss/defaultTheme";

export default {
  /*
  |-----------------------------------------------------------------------------
  | Colors                                  https://tailwindcss.com/docs/colors
  |-----------------------------------------------------------------------------
  |
  | The color palette defined above is also assigned to the "colors" key of
  | your Tailwind config. This makes it easy to access them in your CSS
  | using Tailwind's config helper. For example:
  |
  | .error { color: config('colors.red') }
  |
  */

  colors: {
    transparent: "transparent",
    black: "#282425",
    white: "#ece3ca",

    gray: {
      DEFAULT: "#6d6d6d",
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
      content: "#282425",
    },

    // ---

    base: {
      DEFAULT: "#6d6d6d",
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
      content: "#282425",
    },

    // ---

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
      content: "#282425",
    },

    secondary: {
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
      content: "#f1f8f4",
    },

    tertiary: {
      DEFAULT: "#eaad08",
      50: "#fefbe8",
      100: "#fef7c3",
      200: "#feed8a",
      300: "#fdd835",
      400: "#fac615",
      500: "#eaad08",
      600: "#ca8504",
      700: "#a15e07",
      800: "#854a0e",
      900: "#713d12",
      950: "#421e06",
      content: "#fefbe8",
    },

    accent: {
      DEFAULT: "#d67139",
      50: "#fcf6f0",
      100: "#f9eadb",
      200: "#f1d3b7",
      300: "#e8b589",
      400: "#dc8850",
      500: "#d67139",
      600: "#c85b2e",
      700: "#a64728",
      800: "#853927",
      900: "#6c3122",
      950: "#3a1710",
      content: "#282425",
    },

    neutral: {
      DEFAULT: "#98745a",
      50: "#f6f3f0",
      100: "#e9e1d8",
      200: "#d4c5b4",
      300: "#bba289",
      400: "#a78568",
      500: "#98745a",
      600: "#825f4c",
      700: "#6d4c41",
      800: "#5a3f39",
      900: "#4f3834",
      950: "#2c1e1c",
      content: "#ede6d4",
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
      content: "#dbe6fe",
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
      content: "#dcfce8",
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
      content: "#ffe3e1",
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
      content: "#fee4c7",
    },

    disabled: {
      DEFAULT: "#bdbdbd",
      content: "#404040",
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
    sans: ["Inconsolata", "monospace", ...defaultTheme.fontFamily.sans],
    serif: ["Inconsolata", "monospace", ...defaultTheme.fontFamily.serif],
    mono: ["Inconsolata", "monospace", ...defaultTheme.fontFamily.mono],
  },

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
    DEFAULT: "0",
    none: "0",
    xs: "0",
    sm: "0",
    default: "0",
    lg: "0",
    xl: "0",
    full: "0",
    pill: "0",
    button: "0",
    box: "0",
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

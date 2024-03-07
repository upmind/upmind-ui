/* global module*/

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

let colors = {
  transparent: "transparent",
  black: "var(--color-black, #000000)",
  white: "var(--color-white, #ffffff)",

  // ---

  base: {
    DEFAULT: "var(--color-base, #ffffff)",
    100: "var(--color-base-50,#fafafa)",
    200: "var(--color-base-100,#efefef)",
    300: "var(--color-base-200,#dcdcdc)",
    content: "var(--color-base-content, #000000)",
  },

  gray: {
    DEFAULT: "var(--color-gray,  #6d6d6d)",
    50: "var(--color-gray-50,  #f6f6f6)",
    100: "var(--color-gray-100,  #e7e7e7)",
    200: "var(--color-gray-200,  #d1d1d1)",
    300: "var(--color-gray-300,  #b0b0b0)",
    400: "var(--color-gray-400,  #888888)",
    500: "var(--color-gray-500,  #6d6d6d)",
    600: "var(--color-gray-600,  #5d5d5d)",
    700: "var(--color-gray-700,  #4f4f4f)",
    800: "var(--color-gray-800,  #424242)",
    900: "var(--color-gray-900,  #3d3d3d)",
    950: "var(--color-gray-950,  #262626)",
    content: "var(--color-gray-content,  #e7e7e7)",
  },

  // ---

  primary: {
    DEFAULT: "var(--color-primary,  #8e6cf8)",
    50: "var(--color-primary-50,  #f6f5fd)",
    100: "var(--color-primary-100,  #efecfb)",
    200: "var(--color-primary-200,  #dfdbf9)",
    300: "var(--color-primary-300,  #c7bef4)",
    400: "var(--color-primary-400,  #ac99ec)",
    500: "var(--color-primary-500,  #8e6cf8)",
    600: "var(--color-primary-600,  #7e51d6)",
    700: "var(--color-primary-700,  #673ab7)",
    800: "var(--color-primary-800,  #5c34a3)",
    900: "var(--color-primary-900,  #4c2d85)",
    950: "var(--color-primary-950,  #2f1b5a)",
    content: "var(--color-primary-content,  #f6f5fd)",
  },

  secondary: {
    DEFAULT: "var(--color-secondary, #34b1fd)",
    50: "var(--color-secondary-50, #eefaff)",
    100: "var(--color-secondary-100, #daf3ff)",
    200: "var(--color-secondary-200, #bdebff)",
    300: "var(--color-secondary-300, #8fe0ff)",
    400: "var(--color-secondary-400, #5accff)",
    500: "var(--color-secondary-500, #34b1fd)",
    600: "var(--color-secondary-600, #2196f3)",
    700: "var(--color-secondary-700, #167bdf)",
    800: "var(--color-secondary-800, #1863b5)",
    900: "var(--color-secondary-900, #1a548e)",
    950: "var(--color-secondary-950, #153456)",
    content: "var(--color-secondary-content, #eefaff)",
  },

  tertiary: {
    DEFAULT: "var(--color-tertiary, #eaad08)",
    50: "var(--color-tertiary-50, #fefbe8)",
    100: "var(--color-tertiary-100, #fef7c3)",
    200: "var(--color-tertiary-200, #feed8a)",
    300: "var(--color-tertiary-300, #fdd835)",
    400: "var(--color-tertiary-400, #fac615)",
    500: "var(--color-tertiary-500, #eaad08)",
    600: "var(--color-tertiary-600, #ca8504)",
    700: "var(--color-tertiary-700, #a15e07)",
    800: "var(--color-tertiary-800, #854a0e)",
    900: "var(--color-tertiary-900, #713d12)",
    950: "var(--color-tertiary-950, #421e06)",
    content: "var(--color-tertiary-content, #fefbe8)",
  },

  accent: {
    DEFAULT: "var(--color-accent, #f83c85)",
    50: "var(--color-accent-50, #fef1f7)",
    100: "var(--color-accent-100, #fee5f0)",
    200: "var(--color-accent-200, #fecce3)",
    300: "var(--color-accent-300, #ffa2cb)",
    400: "var(--color-accent-400, #fe68a6)",
    500: "var(--color-accent-500, #f83c85)",
    600: "var(--color-accent-600, #e91e63)",
    700: "var(--color-accent-700, #cb0b47)",
    800: "var(--color-accent-800, #a70d3b)",
    900: "var(--color-accent-900, #8b1034)",
    950: "var(--color-accent-950, #55021a)",
    content: "var(--color-accent-content, #fef1f7)",
  },

  neutral: {
    DEFAULT: "var(--color-neutral, #6d6d6d)",
    50: "var(--color-neutral-50, #f6f6f6)",
    100: "var(--color-neutral-100, #e7e7e7)",
    200: "var(--color-neutral-200, #d1d1d1)",
    300: "var(--color-neutral-300, #b0b0b0)",
    400: "var(--color-neutral-400, #888888)",
    500: "var(--color-neutral-500, #6d6d6d)",
    600: "var(--color-neutral-600, #5d5d5d)",
    700: "var(--color-neutral-700, #4f4f4f)",
    800: "var(--color-neutral-800, #424242)",
    900: "var(--color-neutral-900, #3d3d3d)",
    950: "var(--color-neutral-950, #262626)",
    content: "var(--color-neutral-content, #e7e7e7)",
  },

  // ---

  info: {
    DEFAULT: "var(--color-info, #34b1fd)",
    50: "var(--color-info-50, #eefaff)",
    100: "var(--color-info-100, #daf3ff)",
    200: "var(--color-info-200, #bdebff)",
    300: "var(--color-info-300, #8fe0ff)",
    400: "var(--color-info-400, #5accff)",
    500: "var(--color-info-500, #34b1fd)",
    600: "var(--color-info-600, #2196f3)",
    700: "var(--color-info-700, #167bdf)",
    800: "var(--color-info-800, #1863b5)",
    900: "var(--color-info-900, #1a548e)",
    950: "var(--color-info-950, #153456)",
    content: "var(--color-info-content, #eefaff)",
  },

  success: {
    DEFAULT: "var(--color-success, #00c853)",
    50: "var(--color-success-50, #e8f5e9)",
    100: "var(--color-success-100, #c8e6c9)",
    200: "var(--color-success-200, #a5d6a7)",
    300: "var(--color-success-300, #81c784)",
    400: "var(--color-success-400, #66bb6a)",
    500: "var(--color-success-500, #4caf50)",
    600: "var(--color-success-600, #43a047)",
    700: "var(--color-success-700, #388e3c)",
    800: "var(--color-success-800, #2e7d32)",
    900: "var(--color-success-900, #1b5e20)",
    950: "var(--color-success-950, #102b0b)",
    content: "var(--color-success-content, #e8f5e9)",
  },

  warning: {
    DEFAULT: "var(--color-warning, #ff9800)",
    50: "var(--color-warning-50, #fff3e0)",
    100: "var(--color-warning-100, #ffe0b2)",
    200: "var(--color-warning-200, #ffcc80)",
    300: "var(--color-warning-300, #ffb74d)",
    400: "var(--color-warning-400, #ffa726)",
    500: "var(--color-warning-500, #ff9800)",
    600: "var(--color-warning-600, #fb8c00)",
    700: "var(--color-warning-700, #f57c00)",
    800: "var(--color-warning-800, #ef6c00)",
    900: "var(--color-warning-900, #e65100)",
    950: "var(--color-warning-950, #bf360c)",
    content: "var(--color-warning-content, #fff3e0)",
  },

  error: {
    DEFAULT: "var(--color-error, #f44336)",
    50: "var(--color-error-50, #ffebee)",
    100: "var(--color-error-100, #ffcdd2)",
    200: "var(--color-error-200, #ef9a9a)",
    300: "var(--color-error-300, #e57373)",
    400: "var(--color-error-400, #ef5350)",
    500: "var(--color-error-500, #f44336)",
    600: "var(--color-error-600, #e53935)",
    700: "var(--color-error-700, #d32f2f)",
    800: "var(--color-error-800, #c62828)",
    900: "var(--color-error-900, #b71c1c)",
    950: "var(--color-error-950, #7f0000)",
    content: "var(--color-error-content, #ffebee)",
  },

  disabled: {
    DEFAULT: "var(--color-disabled, #9e9e9e)",
    content: "var(--color-disabled-content, #eeeeee)",
  },
  // ---
};

module.exports = {
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

  colors: colors,

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

  fonts: {
    sans: [
      "system-ui",
      "BlinkMacSystemFont",
      "-apple-system",
      "Segoe UI",
      "Roboto",
      "Oxygen",
      "Ubuntu",
      "Cantarell",
      "Fira Sans",
      "Droid Sans",
      "Helvetica Neue",
      "sans-serif",
    ],
    serif: [
      "Constantia",
      "Lucida Bright",
      "Lucidabright",
      "Lucida Serif",
      "Lucida",
      "DejaVu Serif",
      "Bitstream Vera Serif",
      "Liberation Serif",
      "Georgia",
      "serif",
    ],
    mono: [
      "Menlo",
      "Monaco",
      "Consolas",
      "Liberation Mono",
      "Courier New",
      "monospace",
    ],
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
  | Text colors                         https://tailwindcss.com/docs/text-color
  |-----------------------------------------------------------------------------
  |
  | Here is where you define your text colors. By default these use the
  | color palette we defined above, however you're welcome to set these
  | independently if that makes sense for your project.
  |
  | Class name: .text-{color}
  |
  */

  textColors: colors,

  /*
  |-----------------------------------------------------------------------------
  | Background colors             https://tailwindcss.com/docs/background-color
  |-----------------------------------------------------------------------------
  |
  | Here is where you define your background colors. By default these use
  | the color palette we defined above, however you're welcome to set
  | these independently if that makes sense for your project.
  |
  | Class name: .bg-{color}
  |
  */

  backgroundColors: colors,

  /*
  |-----------------------------------------------------------------------------
  | Border colors                     https://tailwindcss.com/docs/border-color
  |-----------------------------------------------------------------------------
  |
  | Here is where you define your border colors. By default these use the
  | color palette we defined above, however you're welcome to set these
  | independently if that makes sense for your project.
  |
  | Take note that border colors require a special "default" value set
  | as well. This is the color that will be used when you do not
  | specify a border color.
  |
  | Class name: .border-{color}
  |
  */

  borderColors: Object.assign({ default: colors["grey-light"] }, colors),

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
    none: "0",
    sm: ".125rem",
    default: ".25rem",
    lg: ".5rem",
    full: "9999px",
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

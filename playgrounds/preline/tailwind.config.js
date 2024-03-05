/* global  require,module*/

/*

Tailwind - The Utility-First CSS Framework

A project by Adam Wathan (@adamwathan), Jonathan Reinink (@reinink),
David Hemphill (@davidhemphill) and Steve Schoger (@steveschoger).

Welcome to the Tailwind config file. This is where you can customize
Tailwind specifically for your project. Don't be intimidated by the
length of this file. It's really just a big JavaScript object and
we've done our very best to explain each section.

View the full documentation at https://tailwindcss.com.


|-------------------------------------------------------------------------------
| The default config
|-------------------------------------------------------------------------------
|
| This variable contains the default Tailwind config. You don't have
| to use it, but it can sometimes be helpful to have available. For
| example, you may choose to merge your custom configuration
| values with some of the Tailwind defaults.
|
*/

// let defaultConfig = require('tailwindcss/defaultConfig')();

/*
|-------------------------------------------------------------------------------
| Colors                                    https://tailwindcss.com/docs/colors
|-------------------------------------------------------------------------------
|
| Here you can specify the colors used in your project. To get you started,
| we've provided a generous palette of great looking colors that are perfect
| for prototyping, but don't hesitate to change them for your project. You
| own these colors, nothing will break if you change everything about them.
|
| We've used literal color names ("red", "blue", etc.) for the default
| palette, but if you'd rather use functional names like "primary" and
| "secondary", or even a numeric scale like "100" and "200", go for it.
|
*/

let colors = {
  transparent: "transparent",
  black: "#000000",
  white: "#FFFFFF",

  primary: {
    DEFAULT: "#9070e2",
    50: "#f6f5fd",
    100: "#efecfb",
    200: "#dfdbf9",
    300: "#c7bef4",
    400: "#ac99ec",
    500: "#9070e2",
    600: "#7e51d6",
    700: "#673ab7",
    800: "#5c34a3",
    900: "#4c2d85",
    950: "#2f1b5a",
    content: "#f6f5fd"
  },

  secondary: {
    DEFAULT: "#34b1fd",
    50: "#eefaff",
    100: "#daf3ff",
    200: "#bdebff",
    300: "#8fe0ff",
    400: "#5accff",
    500: "#34b1fd",
    600: "#2196f3",
    700: "#167bdf",
    800: "#1863b5",
    900: "#1a548e",
    950: "#153456",
    content: "#eefaff"
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
    content: "#fefbe8"
  },

  accent: {
    DEFAULT: "#f83c85",
    50: "#fef1f7",
    100: "#fee5f0",
    200: "#fecce3",
    300: "#ffa2cb",
    400: "#fe68a6",
    500: "#f83c85",
    600: "#e91e63",
    700: "#cb0b47",
    800: "#a70d3b",
    900: "#8b1034",
    950: "#55021a",
    content: "#fef1f7"
  },

  neutral: {
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
    content: "#e7e7e7"
  }
};

module.exports = {
  darkMode: "media", // Honour the OS preference
  content: [
    "./src/**/*.{html,vue,js,tsx}",
    "../packages/ui/src/**/*.{html,vue,js,tsx}",
    "../../node_modules/preline/preline.js"
  ],

  theme: {
    /*
    |-----------------------------------------------------------------------------
    | Colors                                  https://tailwindcss.com/docs/colors
    |-----------------------------------------------------------------------------
    */

    extend: {
      colors: colors,
      textColors: colors,
      backgroundColors: colors,
      borderColors: colors
    },

    /*
    |-----------------------------------------------------------------------------
    | Fonts                                    https://tailwindcss.com/docs/fonts
    |-----------------------------------------------------------------------------
    */

    fonts: {
      sans: ["Montserrat", "sans-serif"],
      serif: ["Merriweather", "serif"],
      mono: ["Source Code Pro", "Courier New", "monospace"]
    },

    /*
    |-----------------------------------------------------------------------------
    | Text sizes                         https://tailwindcss.com/docs/text-sizing
    |-----------------------------------------------------------------------------
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
      "5xl": "3rem" // 48px
    },

    /*
    |-----------------------------------------------------------------------------
    | Font weights                       https://tailwindcss.com/docs/font-weight
    |-----------------------------------------------------------------------------
    */

    fontWeights: {
      hairline: 100,
      thin: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900
    },

    /*
    |-----------------------------------------------------------------------------
    | Leading (line height)              https://tailwindcss.com/docs/line-height
    |-----------------------------------------------------------------------------
    */

    leading: {
      none: 1,
      tight: 1.25,
      normal: 1.5,
      loose: 2
    },

    /*
    |-----------------------------------------------------------------------------
    | Tracking (letter spacing)       https://tailwindcss.com/docs/letter-spacing
    |-----------------------------------------------------------------------------
    */

    tracking: {
      tight: "-0.05em",
      normal: "0",
      wide: "0.05em"
    },

    /*
    |-----------------------------------------------------------------------------
    | Shadows                                https://tailwindcss.com/docs/shadows
    |-----------------------------------------------------------------------------
    */

    shadows: {
      default: "0 2px 4px 0 rgba(0,0,0,0.10)",
      md: "0 4px 8px 0 rgba(0,0,0,0.12), 0 2px 4px 0 rgba(0,0,0,0.08)",
      lg: "0 15px 30px 0 rgba(0,0,0,0.11), 0 5px 15px 0 rgba(0,0,0,0.08)",
      inner: "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
      outline: "0 0 0 3px rgba(52,144,220,0.5)",
      none: "none"
    }
  },

  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("preline/plugin")
  ]
};

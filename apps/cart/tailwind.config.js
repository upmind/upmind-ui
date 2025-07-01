import themer from "tailwindcss-themer";
import typography from "@tailwindcss/typography";
import animate from "tailwindcss-animate";
import aria from "tailwindcss-aria-attributes";

// --- Themes
import theme from "./src/assets/theme";

// -----------------------------------------------------------------------------

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "media", // Honour the OS preference
  content: [
    "./src/**/*.{html,vue,js,ts,tsx}",
    "../../packages/client-vue/src/**/*.{html,vue,js,tsx,ts}",
    "../../packages/ui/src/**/*.{html,vue,js,tsx,ts}",
    // "./node_modules/@ummind/ui/**/*.{vue,js,ts,jsx,tsx}", // Add this line
    // "./node_modules/@ummind/client-vue/**/*.{vue,js,ts,jsx,tsx}", // Add this line
  ],

  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "collapsible-down": {
          from: { height: 0, opacity: 0 },
          to: { height: "var(--radix-collapsible-content-height)", opacity: 1 },
        },
        "collapsible-up": {
          from: {
            height: "var(--radix-collapsible-content-height)",
            opacity: 1,
          },
          to: { height: 0, opacity: 0 },
        },
        "accordion-down": {
          from: {
            height: 0,
            opacity: 0.5,
            transform: "scaleY(0)",
            transformOrigin: "top",
          },
          to: {
            height: "var(--accordion-content-height)",
            opacity: 1,
            transform: "scaleY(1)",
            transformOrigin: "top",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--accordion-content-height)",
            opacity: 1,
            transform: "scaleY(1)",
            transformOrigin: "top",
          },
          to: {
            height: 0,
            opacity: 0.5,
            transform: "scaleY(0)",
            transformOrigin: "top",
          },
        },
      },
      animation: {
        fade: "fadeIn .5s ease-in-out",
        "collapsible-down": "collapsible-down 0.3s ease-in-out",
        "collapsible-up": "collapsible-up 0.3s ease-in-out",
        "accordion-transform-down": "accordion-down 0.3s ease-out forwards",
        "accordion-transform-up": "accordion-up 0.3s ease-out forwards",
      },
    },
  },

  plugins: [
    animate,
    typography,
    aria,
    themer({
      defaultTheme: theme,
      themes: [theme],
    }),
  ],
};

/* global require, module*/
module.exports = {
  content: ["./src/**/*.{vue,js,ts}"],
  plugins: ["prettier-plugin-tailwindcss"],

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
        from: { height: 0, transform: "translateY(0)" },
        to: {
          height: "var(--radix-accordion-content-height)",
          transform: "translateY(0)",
        },
      },
      "accordion-up": {
        from: {
          height: "var(--radix-accordion-content-height)",
          transform: "translateY(0)",
        },
        to: { height: 0, transform: "translateY(0)" },
      },
    },
    animation: {
      fade: "fadeIn .5s ease-in-out",
      "collapsible-down": "collapsible-down 0.3s ease-in-out",
      "collapsible-up": "collapsible-up 0.3s ease-in-out",
      "accordion-down": "accordion-down 0.3s ease-in-out",
      "accordion-up": "accordion-up 0.3s ease-in-out",
    },
  },
};

/* global require, module*/

module.exports = {
  content: ["./src/**/*.{vue,js,ts}", "../packages/ui/src/**/*.{vue,js,ts}"],
  plugins: [
    require("@tailwindcss/typography"),
    require("daisyui"),
    "prettier-plugin-tailwindcss",
  ],
  daisyui: {
    themes: [
      "light",
      "dark",
      "cupcake",
      "bumblebee",
      "emerald",
      "corporate",
      "synthwave",
      "retro",
      "cyberpunk",
      "valentine",
      "halloween",
      "garden",
      "forest",
      "aqua",
      "lofi",
      "pastel",
      "fantasy",
      "wireframe",
      "black",
      "luxury",
      "dracula",
      "cmyk",
      "autumn",
      "business",
      "acid",
      "lemonade",
      "night",
      "coffee",
      "winter",
    ],
  },
  safelist: [
    {
      pattern:
        /badge-(primary|secondary|accent|info|success|error|warning|neutral)/,
    },
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        "card-xs": "repeat(auto-fill, minmax(180px, 1fr))",
        "card-sm": "repeat(auto-fill, minmax(240px, 1fr))",
        card: "repeat(auto-fill, minmax(320px, 1fr))",
        "card-md": "repeat(auto-fill, minmax(480px, 1fr))",
        "card-lg": "repeat(auto-fill, minmax(640px, 1fr))",
        "card-xl": "repeat(auto-fill, minmax(720px, 1fr))",
      },
    },
  },
};

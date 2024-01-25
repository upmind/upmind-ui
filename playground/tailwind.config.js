/* global require, module*/

module.exports = {
  content: [
    "./src/**/*.{vue,js,ts}",
    "../packages/components/src/**/*.{vue,js,ts}"
  ],
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
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
      "winter"
    ]
  },
  safelist: [
    {
      pattern:
        /badge-(primary|secondary|accent|info|success|error|warning|neutral)/
    }
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        card: "repeat(auto-fill, minmax(320px, 1fr))"
      }
    }
  }
};

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
    "text-3xl",
    "lg:text-4xl",
    { pattern: /bg-(primary|secondary|accent|info|success|error|warning)/ },
    {
      pattern:
        /text-(primary|secondary|accent|info|success|error|warning)-content/
    }
  ]
};

import { create } from "@storybook/theming/create";

export default create({
  base: "light",

  // --- Branding
  brandTitle: "Upmind Labs",
  brandUrl: "/",
  brandImage: "/logo.svg",
  brandTarget: "_self",

  // --- Typography
  fontBase: '"Inter", sans-serif',
  fontCode: '"Inconsolata", monospace',

  // --- Colors
  colorPrimary: "#2b4779",
  colorSecondary: "#018ffd",

  // UI
  appBg: "#F4F6FB",
  appContentBg: "#F4F6FB",
  appPreviewBg: "#ffffff",
  appBorderColor: "#CBD8EC",
  appBorderRadius: 4,

  // Text colors
  textColor: "#2B4779",
  texttonalColor: "#ffffff",

  // Toolbar default and active colors
  barTextColor: "#ffffff",
  barSelectedColor: "#CBD8EC",
  barHoverColor: "#CBD8EC",
  barBg: "#2b4779",

  // Form colors
  inputBg: "#ffffff",
  inputBorder: "#CBD8EC",
  inputTextColor: "#2B4779",
  inputBorderRadius: 4,
});

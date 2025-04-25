import { create } from "@storybook/theming/create";

export default create({
  base: "light",

  // --- Branding
  brandTitle: "Upmind Labs",
  brandUrl: "/",
  brandImage: "/logo.png",
  brandTarget: "_self",

  // --- Typography
  fontBase: '"Inter", sans-serif',
  fontCode: '"Inconsolata", monospace',

  // --- Colors
  colorPrimary: "#251d49",
  colorSecondary: "#e64565",

  // UI
  appBg: "#f8faff",
  appContentBg: "#f8faff",
  appPreviewBg: "#ffffff",
  appBorderColor: "#CBD8EC",
  appBorderRadius: 8,

  // Text colors
  textColor: "#251d49",
  texttonalColor: "#ffffff",

  // Toolbar default and active colors
  barTextColor: "#251d49",
  barSelectedColor: "#585C6D",
  barHoverColor: "#585C6D",
  barBg: "#ffffff",

  // Form colors
  inputBg: "#ffffff",
  inputBorder: "#CBD8EC",
  inputTextColor: "#251d49",
  inputBorderRadius: 8,
});

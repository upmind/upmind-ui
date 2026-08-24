/**
 * Branded manager chrome. The manager UI is static (it cannot follow the
 * preview's runtime theme toolbar), so it wears the house brand: Inter, the
 * violet-cool hand gray rail and the upmind violet as the accent.
 */
import { gray, upmind } from "@upmind/tokens";
import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import { UPMIND_BADGE_BRAND_IMAGE } from "./upmind-badge.ts";

const violet = upmind.light["promo"] ?? "#8757F1";

addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: "Upmind UI",
    brandImage: UPMIND_BADGE_BRAND_IMAGE,
    brandUrl: "https://upmind.com",
    brandTarget: "_blank",

    fontBase: "'Inter Variable', 'Inter', system-ui, sans-serif",
    fontCode:
      "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, 'SF Mono', monospace",

    colorPrimary: gray[900],
    colorSecondary: violet,

    appBg: gray[50],
    appContentBg: "#FFFFFF",
    appPreviewBg: "#FFFFFF",
    appBorderColor: gray[200],
    appBorderRadius: 8,

    textColor: gray[900],
    textInverseColor: gray[50],
    textMutedColor: gray[600],

    barBg: "#FFFFFF",
    barTextColor: gray[600],
    barHoverColor: violet,
    barSelectedColor: gray[900],

    inputBg: "#FFFFFF",
    inputBorder: gray[300],
    inputTextColor: gray[900],
    inputBorderRadius: 6
  })
});

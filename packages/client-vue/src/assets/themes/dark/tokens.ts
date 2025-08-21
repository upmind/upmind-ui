import type { ThemeTokens } from "@upmind-automation/headless";

const tokens: ThemeTokens = {
  fonts: {
    sans: "Inter Tight"
  },
  border: {
    colorDefault: "#3D3D3D",
    colorInput: "#575757"
  },
  ring: {
    colorDefault: "#FA2F62",
    colorRing: "#FA2F62"
  },
  color: {
    foreground: "#FFFFFF",
    background: "#121212",
    surface: "#1e1e1e",
    canvas: "#121212",

    // mutedForeground: "#575757",

    primary: "#FA2F62",
    primaryForeground: "#FFFFFF",
    primaryBackground: "#FA2F62",

    secondary: "#794DFF",
    secondaryForeground: "#FFFFFF",
    secondaryBackground: "#FA2F62",

    control: "#262626",
    controlBackground: "#262626",
    controlForeground: "#FFFFFF",
    controlActive: "#FA2F62",
    controlActiveMuted: "#262626",
    controlActiveForeground: "#FFFFFF",
    controlActiveBackground: "#262626",
    controlActiveHover: "#FA2F62",
    controlActiveFocus: "#FA2F62",
    controlErrorMuted: "#ef444420",

    iconPrimary: "#FFFFFF",
    iconSecondary: "#FA2F62"
  }
};

export default tokens;

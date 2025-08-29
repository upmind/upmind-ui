import { cva } from "class-variance-authority"; // If you have a type for cva, otherwise use `any`

// -----------------------------------------------------------------------------

export type ThemeConfigValue =
  | ReturnType<typeof cva>
  | { [component: string]: ThemeConfigValue };

export interface ThemeConfig {
  [component: string]: ThemeConfigValue;
}

// Inferred from tokens.json
export interface ThemeTokens {
  fonts?: {
    sans?: string;
    body?: string;
    display?: string;
  };
  maxWidth: {
    app: {
      default: string;
      lg: string;
    };
  };
  radius?: {
    none?: string;
    sm?: string;
    default?: string;
    lg?: string;
    xl?: string;
    "2xl"?: string;
    "3xl"?: string;
    full?: string;
    pill?: string;
    button?: string;
    box?: string;
  };
  border?: {
    colorDefault?: string;
    colorInput?: string;
    colorControlDefault?: string;
    colorControlStrong?: string;
  };
  ring?: {
    colorDefault?: string;
    colorRing?: string;
    colorInvalid?: string;
  };
  color?: {
    transparent?: string;
    black?: string;
    white?: string;

    background?: string;
    foreground?: string;
    surface?: string;
    canvas?: string;

    base?: string;
    baseBackground?: string;
    baseForeground?: string;
    baseMuted?: string;
    baseMutedForeground?: string;
    baseMutedActive?: string;

    primary?: string;
    primaryForeground?: string;
    primaryBackground?: string;
    primaryGradientStart?: string;
    primaryGradientEnd?: string;
    primaryMuted?: string;
    primaryMutedForeground?: string;
    primaryMutedActive?: string;

    secondary?: string;
    secondaryForeground?: string;
    secondaryBackground?: string;
    secondaryGradientStart?: string;
    secondaryGradientEnd?: string;
    secondaryMuted?: string;
    secondaryMutedForeground?: string;
    secondaryMutedActive?: string;

    promotion?: string;
    promotionForeground?: string;
    promotionBackground?: string;
    promotionMuted?: string;
    promotionMutedForeground?: string;
    promotionMutedActive?: string;

    destructive?: string;
    destructiveForeground?: string;
    destructiveBackground?: string;
    destructiveMuted?: string;
    destructiveMutedForeground?: string;
    destructiveMutedActive?: string;

    info?: string;
    infoForeground?: string;
    infoBackground?: string;
    infoMuted?: string;
    infoMutedForeground?: string;
    infoMutedActive?: string;

    success?: string;
    successForeground?: string;
    successBackground?: string;
    successMuted?: string;
    successMutedForeground?: string;
    successMutedActive?: string;

    warning?: string;
    warningForeground?: string;
    warningBackground?: string;
    warningMuted?: string;
    warningMutedForeground?: string;
    warningMutedActive?: string;

    error?: string;
    errorForeground?: string;
    errorBackground?: string;
    errorMuted?: string;
    errorMutedForeground?: string;
    errorMutedActive?: string;

    /* Control Colors */
    control?: string;
    controlBackground?: string;
    controlForeground?: string;
    controlActive?: string;
    controlActiveMuted?: string;
    controlActiveForeground?: string;
    controlActiveBackground?: string;
    controlActiveHover?: string;
    controlActiveFocus?: string;
    controlError?: string;
    controlErrorMuted?: string;
    controlErrorForeground?: string;
    controlErrorBackground?: string;

    /* Icon Colors */
    iconPrimary?: string;
    iconSecondary?: string;
  };
}

export interface Theme {
  name: string;
  id: string;
  icon?: string;
  uiConfig?: ThemeConfig;
  tokens?: ThemeTokens;
}

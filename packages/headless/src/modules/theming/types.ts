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
  button?: {
    radius: string;
  };
  control?: {
    radius: string;
  };
  badge?: {
    radius: string;
  };
  image?: {
    radius: string;
  };
  card?: {
    radius: string;
  };
  message?: {
    radius: string;
  };
  stroke?: {
    icon: string;
    badge: string;
  };
  color?: {
    primary: string;
    secondary: string;

    primitive: {
      core: {
        canvas: string;
        surface: string;
        base: string;
        display: string;
        faint: string;
        muted: string;
        skeleton: string;
        overlay: string;
      };

      control: {
        default: string;
        defaultDelta: string;
        defaultContrast: string;
        muted: string;
        mutedContrast: string;
        stroke: string;
        strokeDelta: string;
      };

      primary: {
        default: string;
        defaultStop: string;
        defaultDelta: string;
        defaultContrast: string;
        muted: string;
        mutedContrast: string;
      };

      secondary: {
        default: string;
        defaultStop: string;
        defaultDelta: string;
        defaultContrast: string;
      };

      neutral: {
        default: string;
        defaultDelta: string;
        defaultContrast: string;
        muted: string;
        mutedDelta: string;
        mutedContrast: string;
        stroke: string;
        strokeDelta: string;
      };

      promo: {
        default: string;
        defaultContrast: string;
        muted: string;
        mutedContrast: string;
      };

      danger: {
        default: string;
        defaultDelta: string;
        defaultContrast: string;
        muted: string;
        mutedContrast: string;
      };

      warning: {
        default: string;
        defaultContrast: string;
        muted: string;
        mutedContrast: string;
      };

      success: {
        default: string;
        defaultContrast: string;
        muted: string;
        mutedContrast: string;
      };

      info: {
        default: string;
        defaultContrast: string;
        muted: string;
        mutedContrast: string;
      };
    };

    background: {
      canvas: string;
      surface: string;
      surfaceGlass: string;
      skeleton: string;
      overlay: string;

      accent: {
        primary: string;
        primaryMuted: string;
        neutral: string;
        neutralMuted: string;
        promo: string;
        promoMuted: string;
        danger: string;
        dangerMuted: string;
        warning: string;
        warningMuted: string;
        success: string;
        successMuted: string;
        info: string;
        infoMuted: string;
      };

      button: {
        primaryRing: string;
        primary0: string;
        primary1: string;
        primaryHover0: string;
        primaryHover1: string;
        secondaryRing: string;
        secondary0: string;
        secondary1: string;
        secondaryHover0: string;
        secondaryHover1: string;
        neutralRing: string;
        neutral0: string;
        neutral1: string;
        neutralHover0: string;
        neutralHover1: string;
        subtleRing: string;
        subtle0: string;
        subtle1: string;
        subtleHover0: string;
        subtleHover1: string;
        dangerRing: string;
        danger0: string;
        danger1: string;
        dangerHover0: string;
        dangerHover1: string;
        outline: string;
        outlineHover: string;
        outlineRing: string;
        ghost: string;
        ghostHover: string;
        ghostRing: string;
      };

      control: {
        checked: string;
        checkedHover: string;
        checkedContrast: string;
        unchecked: string;
        uncheckedHover: string;
        selected: string;
        surface: string;
        ring: string;
      };
    };

    border: {
      surface: string;

      accent: {
        primary: string;
        secondary: string;
        neutral: string;
        promo: string;
        danger: string;
        warning: string;
        success: string;
        info: string;
      };

      button: {
        outline: string;
        outlineHover: string;
      };

      control: {
        default: string;
        hover: string;
        selected: string;
      };
    };

    icon: {
      primary: string;
      neutral: string;
      subtle: string;
    };

    text: {
      primary: string;
      base: string;
      display: string;
      faint: string;
      muted: string;

      accent: {
        primary: string;
        primaryMutedContrast: string;
        primaryContrast: string;
        neutral: string;
        neutralMutedContrast: string;
        neutralContrast: string;
        promo: string;
        promoMutedContrast: string;
        promoContrast: string;
        danger: string;
        dangerMutedContrast: string;
        dangerContrast: string;
        warning: string;
        warningMutedContrast: string;
        warningContrast: string;
        success: string;
        successMutedContrast: string;
        successContrast: string;
        info: string;
        infoMutedContrast: string;
        infoContrast: string;
      };

      control: {
        selected: string;
      };

      button: {
        primary: string;
        secondary: string;
        neutral: string;
        subtle: string;
        danger: string;
        outline: string;
        ghost: string;
        link: string;
        linkHover: string;
        dangerLink: string;
        dangerLinkHover: string;
        mutedLink: string;
        mutedLinkHover: string;
      };
    };
  };
}

export interface Theme {
  name: string;
  id: string;
  icon?: string;
  uiConfig?: ThemeConfig;
  tokens?: string;
}

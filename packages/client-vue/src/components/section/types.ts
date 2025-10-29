// --- external
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";
import type {
  InterstitialProps,
  IconProps
} from "@upmind-automation/upmind-ui";

// --- internal

export interface I18nText {
  key: string;
  plural?: number;
}

export interface InterstitialExtendedProps extends InterstitialProps {
  i18nTitle?: I18nText;
}
export interface SectionProps {
  title?: string;
  icon?: IconProps["icon"];
  as?: string;
  class?: HTMLAttributes["class"];
  aside?: boolean;
  section?: boolean;
  uiConfig?: {
    section: {
      root: CxOptions;
      header: CxOptions;
      title: CxOptions;
      content: CxOptions;
    };
  };
}

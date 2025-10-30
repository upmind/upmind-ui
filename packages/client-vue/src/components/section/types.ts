// --- external
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";
import type { InterstitialProps, TabItem } from "@upmind-automation/upmind-ui";

// --- internal

export interface I18nText {
  key: string;
  plural?: number;
}

export interface InterstitialExtendedProps extends InterstitialProps {
  i18nTitle?: I18nText;
}

export interface SectionItem extends TabItem {}

export interface SectionsProps {
  active?: boolean;
  class?: HTMLAttributes["class"];
  sections: SectionItem[];
  defaultValue?: string;
  uiConfig?: {
    section: {
      root: CxOptions;
      header: CxOptions;
      title: CxOptions;
      content: CxOptions;
    };
  };
}

export interface SectionProps {
  active?: boolean;
  label: string;
  icon?: string;
}

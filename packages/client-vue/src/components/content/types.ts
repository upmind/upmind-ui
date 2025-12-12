// --- external
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";
import type { InterstitialProps } from "@upmind-automation/upmind-ui";
import type { LayoutProps } from "../layout/types";

// --- internal
import type { titleVariants } from "./content.config";
import type { TabItem } from "@upmind-automation/upmind-ui";
import type { BadgeProps } from "@upmind-automation/upmind-ui";
type TitleVariantProps = VariantProps<typeof titleVariants>;

export interface ContentSectionProps {
  title?: string;
  tagline?: string;
  class?: HTMLAttributes["class"];
  uiConfig?: {
    root?: CxOptions;
    header?: CxOptions;
    title?: CxOptions;
    tagline?: CxOptions;
    content?: CxOptions;
    footer?: CxOptions;
  };
}

export interface I18nText {
  key: string;
  plural?: number;
}

export interface InterstitialExtendedProps extends InterstitialProps {
  i18nTitle?: I18nText;
}
export interface SectionProps {
  variant?: LayoutProps["variant"];
  title?: string;
  as?: string;
  class?: HTMLAttributes["class"];
  aside?: boolean;
  uiConfig?: {
    section: {
      root: CxOptions;
      header: CxOptions;
      title: CxOptions;
      content: CxOptions;
    };
  };
}

export interface HeaderProps {
  badge?: BadgeProps;
  title?: string;
  description?: string;
  tabs?: TabItem[];
  defaultTab?: TabItem["value"];
}

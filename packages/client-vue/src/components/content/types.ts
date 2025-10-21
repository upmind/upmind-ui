// --- external
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";
import type {
  InterstitialProps,
  LayoutProps,
  IconProps
} from "@upmind-automation/upmind-ui";

// --- internal
import type { titleVariants } from "./content.config";
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
  icon?: IconProps["icon"];
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

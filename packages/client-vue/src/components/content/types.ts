// --- external
import type { CxOptions, VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";
import type {
  InterstitialProps,
  LayoutProps
} from "@upmind-automation/upmind-ui";

// --- internal
import type { titleVariants } from "./content.config";
type TitleVariantProps = VariantProps<typeof titleVariants>;

export interface SmartTitleProps {
  i18nKey: string;
  plural?: number;
  color?: string;
  align?: TitleVariantProps["align"];
  size?: TitleVariantProps["size"];
  class?: HTMLAttributes["class"];
  as?: string;
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

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
  title?: string;
  as?: string;
  class?: HTMLAttributes["class"];
  uiConfig?: {
    section: {
      root: CxOptions;
      header: CxOptions;
      title: CxOptions;
      content: CxOptions;
    };
  };
}

// --- external
import type { VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "vue";
import type { InterstitialProps } from "@upmind-automation/upmind-ui";

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
    root?: string;
    header?: string;
    title?: string;
    tagline?: string;
    content?: string;
    footer?: string;
  };
}

export interface I18nText {
  key: string;
  plural?: number;
}

export interface InterstitialExtendedProps extends InterstitialProps {
  i18nTitle?: I18nText;
}

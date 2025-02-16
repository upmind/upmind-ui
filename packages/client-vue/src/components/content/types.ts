// --- external
import type { VariantProps } from "class-variance-authority";

// --- internal
import type { title } from "./config.cva";
type TitleVariantProps = VariantProps<typeof title>;

export interface SmartTitleProps {
  i18nKey: string;
  plural?: number;
  color?: string;
  align?: TitleVariantProps["align"];
  size?: TitleVariantProps["size"];
  class?: string;
}

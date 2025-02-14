// --- external
import type { VariantProps } from "class-variance-authority";

// --- internal
import type { title } from "./config.cva";
type TitleVariantProps = VariantProps<typeof title>;

export interface Mask {
  text: string;
  keywords?: string;
}

export interface SmartTitleProps {
  title: string | Mask;
  color?: string;
  align?: TitleVariantProps["align"];
  size?: TitleVariantProps["size"];
}

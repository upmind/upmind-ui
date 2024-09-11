// --- external
import { type VariantProps } from "class-variance-authority";

// --- internal
import type { iconConfig } from "./icon.config";
export type IconConfig = VariantProps<typeof iconConfig>;

// --- types

export interface IconProps {
  icon: string | Icon;
}

export interface Icon {
  name: string;
  path: string;
}

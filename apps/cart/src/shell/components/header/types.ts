import {
  createVariantConstants,
  type VariantValue
} from "@upmind-automation/foundation";
import {
  COLUMN_JUSTIFY,
  COLUMN_ITEMS,
  COLUMN_PADDING
} from "@upmind-automation/foundation";
import {
  RIBBON_BACKGROUND,
  RIBBON_BORDER
} from "@upmind-automation/foundation";
import { variants } from "./variants";

export const HEADER_POSITION = createVariantConstants(variants.position);
export const HEADER_JUSTIFY = COLUMN_JUSTIFY;
export const HEADER_ITEMS = COLUMN_ITEMS;
export const HEADER_BACKGROUND = RIBBON_BACKGROUND;
export const HEADER_PADDING = COLUMN_PADDING;
export const HEADER_BORDER = RIBBON_BORDER;

export type HEADER_POSITION = VariantValue<typeof HEADER_POSITION>;
export type HEADER_JUSTIFY = VariantValue<typeof COLUMN_JUSTIFY>;
export type HEADER_ITEMS = VariantValue<typeof COLUMN_ITEMS>;
export type HEADER_BACKGROUND = VariantValue<typeof RIBBON_BACKGROUND>;
export type HEADER_PADDING = VariantValue<typeof COLUMN_PADDING>;
export type HEADER_BORDER = VariantValue<typeof RIBBON_BORDER>;

export type UseHeaderProps = {
  visible?: boolean;
  noSession?: boolean;
  noBasket?: boolean;
  noLogo?: boolean;
  background?: HEADER_BACKGROUND;
  position?: HEADER_POSITION;
  padding?: COLUMN_PADDING;
  border?: RIBBON_BORDER;
  items?: COLUMN_ITEMS;
  justifyLeft?: HEADER_JUSTIFY;
  justifyRight?: HEADER_JUSTIFY;
};

import {
  parseVariants,
  type VariantValues
} from "@upmind-automation/upmind-ui";
import {
  COLUMN_JUSTIFY,
  COLUMN_ITEMS,
  COLUMN_PADDING
} from "../layout/components/column";
import { RIBBON_BACKGROUND, RIBBON_BORDER } from "../layout/components/ribbon";
import { variants } from "./header.config";

export const HEADER_POSITION = parseVariants(variants.position);
export const HEADER_JUSTIFY = COLUMN_JUSTIFY;
export const HEADER_ITEMS = COLUMN_ITEMS;
export const HEADER_BACKGROUND = RIBBON_BACKGROUND;
export const HEADER_PADDING = COLUMN_PADDING;
export const HEADER_BORDER = RIBBON_BORDER;

export type HEADER_POSITION = VariantValues<typeof HEADER_POSITION>;
export type HEADER_JUSTIFY = VariantValues<typeof COLUMN_JUSTIFY>;
export type HEADER_ITEMS = VariantValues<typeof COLUMN_ITEMS>;
export type HEADER_BACKGROUND = VariantValues<typeof RIBBON_BACKGROUND>;
export type HEADER_PADDING = VariantValues<typeof COLUMN_PADDING>;
export type HEADER_BORDER = VariantValues<typeof RIBBON_BORDER>;

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

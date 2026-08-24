import {
  parseVariants,
  type VariantValues
} from "../../../../utils/parseVariants";
import { variants } from "./variants";

export const COLUMN_FLOW = parseVariants(variants.flow);
export const COLUMN_BACKGROUND = parseVariants(variants.background);
export const COLUMN_JUSTIFY = parseVariants(variants.justify);
export const COLUMN_ITEMS = parseVariants(variants.items);
export const COLUMN_PADDING = parseVariants(variants.padding);
export const COLUMN_WIDTH = parseVariants(variants.width);
export const COLUMN_HIDE = parseVariants(variants.hide);
export const COLUMN_SHOW = parseVariants(variants.show);

export type COLUMN_WIDTH = VariantValues<typeof COLUMN_WIDTH>;
export type COLUMN_FLOW = VariantValues<typeof COLUMN_FLOW>;
export type COLUMN_BACKGROUND = VariantValues<typeof COLUMN_BACKGROUND>;
export type COLUMN_JUSTIFY = VariantValues<typeof COLUMN_JUSTIFY>;
export type COLUMN_ITEMS = VariantValues<typeof COLUMN_ITEMS>;
export type COLUMN_PADDING = VariantValues<typeof COLUMN_PADDING>;
export type COLUMN_HIDE = VariantValues<typeof COLUMN_HIDE>;
export type COLUMN_SHOW = VariantValues<typeof COLUMN_SHOW>;

export type ColumnProps = {
  as?: string;
  class?: string;
  width?: COLUMN_WIDTH;
  flow?: COLUMN_FLOW;
  justify?: COLUMN_JUSTIFY;
  items?: COLUMN_ITEMS;
  background?: COLUMN_BACKGROUND;
  padding?: COLUMN_PADDING;
  gap?: boolean;
  hide?: COLUMN_HIDE;
  show?: COLUMN_SHOW;
};

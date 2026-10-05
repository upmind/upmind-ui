import { createVariantConstants, type VariantValue } from "../../../variants";
import { variants } from "./variants";

export const COLUMN_FLOW = createVariantConstants(variants.flow);
export const COLUMN_BACKGROUND = createVariantConstants(variants.background);
export const COLUMN_JUSTIFY = createVariantConstants(variants.justify);
export const COLUMN_ITEMS = createVariantConstants(variants.items);
export const COLUMN_PADDING = createVariantConstants(variants.padding);
export const COLUMN_WIDTH = createVariantConstants(variants.width);
export const COLUMN_HIDE = createVariantConstants(variants.hide);
export const COLUMN_SHOW = createVariantConstants(variants.show);

export type COLUMN_WIDTH = VariantValue<typeof COLUMN_WIDTH>;
export type COLUMN_FLOW = VariantValue<typeof COLUMN_FLOW>;
export type COLUMN_BACKGROUND = VariantValue<typeof COLUMN_BACKGROUND>;
export type COLUMN_JUSTIFY = VariantValue<typeof COLUMN_JUSTIFY>;
export type COLUMN_ITEMS = VariantValue<typeof COLUMN_ITEMS>;
export type COLUMN_PADDING = VariantValue<typeof COLUMN_PADDING>;
export type COLUMN_HIDE = VariantValue<typeof COLUMN_HIDE>;
export type COLUMN_SHOW = VariantValue<typeof COLUMN_SHOW>;

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

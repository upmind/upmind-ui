import { createVariantConstants, type VariantValue } from "../../../variants";
import { variants } from "./variants";
import type { COLUMN_ITEMS } from "../column/types";

export const CONTENT_GAP = createVariantConstants(variants.gap);
export const CONTENT_FLOW = createVariantConstants(variants.flow);
export const CONTENT_JUSTIFY = createVariantConstants(variants.justify);
export const CONTENT_ITEMS = createVariantConstants(variants.items);
export const CONTENT_WIDTH = createVariantConstants(variants.width);
export const CONTENT_STICKY = createVariantConstants(variants.sticky);
export const CONTENT_PADDING = createVariantConstants(variants.padding);
export const CONTENT_HEIGHT = createVariantConstants(variants.height);

export type CONTENT_GAP = VariantValue<typeof CONTENT_GAP>;
export type CONTENT_FLOW = VariantValue<typeof CONTENT_FLOW>;
export type CONTENT_JUSTIFY = VariantValue<typeof CONTENT_JUSTIFY>;
export type CONTENT_ITEMS = VariantValue<typeof COLUMN_ITEMS>;
export type CONTENT_WIDTH = VariantValue<typeof CONTENT_WIDTH>;
export type CONTENT_STICKY = VariantValue<typeof CONTENT_STICKY>;
export type CONTENT_PADDING = VariantValue<typeof CONTENT_PADDING>;
export type CONTENT_HEIGHT = VariantValue<typeof CONTENT_HEIGHT>;

export type ContentProps = {
  class?: string;
  as?: string;
  gap?: CONTENT_GAP;
  flow?: CONTENT_FLOW;
  justify?: CONTENT_JUSTIFY;
  items?: COLUMN_ITEMS;
  width?: CONTENT_WIDTH;
  sticky?: CONTENT_STICKY;
  padding?: boolean;
  height?: CONTENT_HEIGHT;
};

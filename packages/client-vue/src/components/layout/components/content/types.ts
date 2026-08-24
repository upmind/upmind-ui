import {
  parseVariants,
  type VariantValues
} from "../../../../utils/parseVariants";
import { variants } from "./variants";
import type { COLUMN_ITEMS } from "../column/types";

export const CONTENT_GAP = parseVariants(variants.gap);
export const CONTENT_FLOW = parseVariants(variants.flow);
export const CONTENT_JUSTIFY = parseVariants(variants.justify);
export const CONTENT_ITEMS = parseVariants(variants.items);
export const CONTENT_WIDTH = parseVariants(variants.width);
export const CONTENT_STICKY = parseVariants(variants.sticky);
export const CONTENT_PADDING = parseVariants(variants.padding);
export const CONTENT_HEIGHT = parseVariants(variants.height);

export type CONTENT_GAP = VariantValues<typeof CONTENT_GAP>;
export type CONTENT_FLOW = VariantValues<typeof CONTENT_FLOW>;
export type CONTENT_JUSTIFY = VariantValues<typeof CONTENT_JUSTIFY>;
export type CONTENT_ITEMS = VariantValues<typeof COLUMN_ITEMS>;
export type CONTENT_WIDTH = VariantValues<typeof CONTENT_WIDTH>;
export type CONTENT_STICKY = VariantValues<typeof CONTENT_STICKY>;
export type CONTENT_PADDING = VariantValues<typeof CONTENT_PADDING>;
export type CONTENT_HEIGHT = VariantValues<typeof CONTENT_HEIGHT>;

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

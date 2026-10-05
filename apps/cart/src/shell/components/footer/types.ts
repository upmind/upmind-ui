import {
  createVariantConstants,
  type VariantValue
} from "@upmind-automation/foundation";
import { COLUMN_ITEMS, COLUMN_JUSTIFY } from "@upmind-automation/foundation";
import { RIBBON_BACKGROUND } from "@upmind-automation/foundation";
import { variants } from "./variants";

export const FOOTER_POSITION = createVariantConstants(variants.position);
export const FOOTER_BACKGROUND = RIBBON_BACKGROUND;
export const FOOTER_ITEMS = COLUMN_ITEMS;
export const FOOTER_JUSTIFY = COLUMN_JUSTIFY;

export type FOOTER_BACKGROUND = VariantValue<typeof FOOTER_BACKGROUND>;
export type FOOTER_POSITION = VariantValue<typeof FOOTER_POSITION>;
export type FOOTER_ITEMS = VariantValue<typeof FOOTER_ITEMS>;
export type FOOTER_JUSTIFY = VariantValue<typeof COLUMN_JUSTIFY>;

export enum FOOTER_LAYOUT {
  FLAT = "flat",
  STACKED = "stacked"
}

export type FooterProps = {
  layout?: FOOTER_LAYOUT;
  // ---
  visible?: boolean;
  border?: boolean;
  reverse?: boolean;
  background?: FOOTER_BACKGROUND;
  position?: FOOTER_POSITION;
  items?: FOOTER_ITEMS;
  justifyLeft?: FOOTER_JUSTIFY;
  justifyRight?: FOOTER_JUSTIFY;
  // ---
  noLocale?: boolean;
  noCurrency?: boolean;
  noPoweredBy?: boolean;
  noCopyright?: boolean;
};

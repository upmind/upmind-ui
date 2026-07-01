import {
  parseVariants,
  type VariantValues
} from "@upmind-automation/upmind-ui";
import { COLUMN_ITEMS, COLUMN_JUSTIFY } from "../layout/components/column";
import { RIBBON_BACKGROUND } from "../layout/components/ribbon";
import { variants } from "./footer.config";

export const FOOTER_POSITION = parseVariants(variants.position);
export const FOOTER_BACKGROUND = RIBBON_BACKGROUND;
export const FOOTER_ITEMS = COLUMN_ITEMS;
export const FOOTER_JUSTIFY = COLUMN_JUSTIFY;

export type FOOTER_BACKGROUND = VariantValues<typeof FOOTER_BACKGROUND>;
export type FOOTER_POSITION = VariantValues<typeof FOOTER_POSITION>;
export type FOOTER_ITEMS = VariantValues<typeof FOOTER_ITEMS>;
export type FOOTER_JUSTIFY = VariantValues<typeof COLUMN_JUSTIFY>;

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

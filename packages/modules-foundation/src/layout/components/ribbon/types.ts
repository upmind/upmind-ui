import { createVariantConstants, type VariantValue } from "../../../variants";
import { variants } from "./variants";

export const RIBBON_STICKY = createVariantConstants(variants.sticky);
export const RIBBON_BACKGROUND = createVariantConstants(variants.background);
export const RIBBON_BORDER = createVariantConstants(variants.border);
export const RIBBON_HEIGHT = createVariantConstants(variants.height);

export type RIBBON_STICKY = VariantValue<typeof RIBBON_STICKY>;
export type RIBBON_BACKGROUND = VariantValue<typeof RIBBON_BACKGROUND>;
export type RIBBON_BORDER = VariantValue<typeof RIBBON_BORDER>;
export type RIBBON_HEIGHT = VariantValue<typeof RIBBON_HEIGHT>;

export type RibbonProps = {
  class?: string;
  as?: string;
  background?: RIBBON_BACKGROUND;
  border?: RIBBON_BORDER;
  sticky?: RIBBON_STICKY;
  height?: RIBBON_HEIGHT;
};

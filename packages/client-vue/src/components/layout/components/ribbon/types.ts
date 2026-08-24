import {
  parseVariants,
  type VariantValues
} from "../../../../utils/parseVariants";
import { variants } from "./variants";

export const RIBBON_STICKY = parseVariants(variants.sticky);
export const RIBBON_BACKGROUND = parseVariants(variants.background);
export const RIBBON_BORDER = parseVariants(variants.border);
export const RIBBON_HEIGHT = parseVariants(variants.height);

export type RIBBON_STICKY = VariantValues<typeof RIBBON_STICKY>;
export type RIBBON_BACKGROUND = VariantValues<typeof RIBBON_BACKGROUND>;
export type RIBBON_BORDER = VariantValues<typeof RIBBON_BORDER>;
export type RIBBON_HEIGHT = VariantValues<typeof RIBBON_HEIGHT>;

export type RibbonProps = {
  class?: string;
  as?: string;
  background?: RIBBON_BACKGROUND;
  border?: RIBBON_BORDER;
  sticky?: RIBBON_STICKY;
  height?: RIBBON_HEIGHT;
};

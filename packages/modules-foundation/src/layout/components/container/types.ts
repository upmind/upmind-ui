import { createVariantConstants, type VariantValue } from "../../../variants";
import { variants } from "./variants";

export const CONTAINER_FLOW = createVariantConstants(variants.flow);
export const CONTAINER_ITEMS = createVariantConstants(variants.items);
export const CONTAINER_JUSTIFY = createVariantConstants(variants.justify);

export type CONTAINER_FLOW = VariantValue<typeof CONTAINER_FLOW>;
export type CONTAINER_ITEMS = VariantValue<typeof CONTAINER_ITEMS>;
export type CONTAINER_JUSTIFY = VariantValue<typeof CONTAINER_JUSTIFY>;

export type ContainerProps = {
  class?: string;
  flow?: CONTAINER_FLOW;
  items?: CONTAINER_ITEMS;
  justify?: CONTAINER_JUSTIFY;
  reverse?: boolean;
};

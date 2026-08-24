import {
  parseVariants,
  type VariantValues
} from "../../../../utils/parseVariants";
import { variants } from "./variants";

export const CONTAINER_FLOW = parseVariants(variants.flow);
export const CONTAINER_ITEMS = parseVariants(variants.items);
export const CONTAINER_JUSTIFY = parseVariants(variants.justify);

export type CONTAINER_FLOW = VariantValues<typeof CONTAINER_FLOW>;
export type CONTAINER_ITEMS = VariantValues<typeof CONTAINER_ITEMS>;
export type CONTAINER_JUSTIFY = VariantValues<typeof CONTAINER_JUSTIFY>;

export type ContainerProps = {
  class?: string;
  flow?: CONTAINER_FLOW;
  items?: CONTAINER_ITEMS;
  justify?: CONTAINER_JUSTIFY;
  reverse?: boolean;
};

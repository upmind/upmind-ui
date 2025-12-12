import type { SubproductValue } from "@upmind-automation/headless";

export type SubproductCardProps = SubproductValue & {
  processing?: boolean;
  minimal?: boolean;
};

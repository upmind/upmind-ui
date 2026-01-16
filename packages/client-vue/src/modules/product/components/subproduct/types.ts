import type {
  SubproductValue,
  UseMetaResult,
  ProductSummaryMeta
} from "@upmind-automation/headless";

export type SubproductCardProps = Omit<SubproductValue, "meta"> & {
  processing?: boolean;
  minimal?: boolean;
  meta: UseMetaResult;
  term?: number;
  productMeta?: ProductSummaryMeta;
};

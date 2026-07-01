import type {
  SubproductValue,
  UseMetaResult,
  ProductSummaryMeta
} from "@upmind-automation/headless";
import type { ImgHTMLAttributes } from "vue";

export type SubproductCardProps = Omit<SubproductValue, "meta" | "brand"> & {
  processing?: boolean;
  minimal?: boolean;
  meta: UseMetaResult;
  term?: number;
  productMeta?: ProductSummaryMeta;
  image?: string;
  dropdown?: boolean;
};

export interface SubproductCardImage {
  src?: ImgHTMLAttributes["src"];
  alt?: ImgHTMLAttributes["alt"];
  minimal?: boolean;
  dropdown?: boolean;
}

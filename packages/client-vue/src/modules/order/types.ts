import type { StorefrontRoute } from "../../types";

export { PAYMENT_STATE, type PaymentState } from "@upmind-automation/headless";

export enum ORDER_TEMPLATE {
  FULL = "full",
  TWO_COLUMN_LTR = "two-column-ltr",
  TWO_COLUMN_RTL = "two-column-rtl",
  ENCLOSED = "enclosed",
  INSET = "inset"
}

export type OrderProps = {
  template?: ORDER_TEMPLATE;
  storefrontRoute?: StorefrontRoute;
};

export type TableRow = {
  item: string;
  meta: TableRowMeta;
  price?: string;
  qty?: number | string;
  total?: string;
};

export type TableRowMeta = {
  detail?: boolean;
  emphasis?: boolean;
  indented?: boolean;
  lastBeforeOption?: boolean;
  lastOfGroup?: boolean;
  term?: boolean;
};

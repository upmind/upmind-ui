export interface Item {
  title?: string;
  subtitle?: string;
  imageSrc?: string;
  additionalCost?: string;
  additionalDetails?: Array<{
    category: string;
    name?: string;
    invalid?: boolean;
  }>;
}

export enum PRODUCT_TEMPLATE {
  FULL = "full",
  TWO_COLUMN_LTR = "two-column-ltr",
  TWO_COLUMN_RTL = "two-column-rtl",
  ENCLOSED = "enclosed"
}

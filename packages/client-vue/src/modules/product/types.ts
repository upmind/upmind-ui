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

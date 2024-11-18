import type { DomainProduct } from "@upmind/headless";

export interface DomainCardProps extends DomainProduct {
  selected?: boolean;
  disabled?: boolean;
  processing?: boolean;
  // ---
  color?: string;
}

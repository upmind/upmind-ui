import type { DomainProduct } from "@upmind-automation/headless";

export interface DomainCardProps extends DomainProduct {
  selected?: boolean;
  disabled?: boolean;
  processing?: boolean;
  // ---
  color?: string;
}

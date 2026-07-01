import type { ICurrency } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

export type Currency = {
  base: boolean;
  code: ICurrency["code"];
  createdAt: string;
  decimals: boolean;
  id: string;
  manual: number;
  name: string;
  prefix: string;
  suffix: string;
  updatedAt: string;
};

// --- external
import type { CxOptions } from "class-variance-authority";
import type { HTMLAttributes } from "vue";

export interface TableProps {
  columns?: string[];
  rows?: string[][];
  // ---
  uiConfig?: { table: CxOptions };
  class?: HTMLAttributes["class"];
}

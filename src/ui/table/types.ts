// --- external
import type { CxOptions } from "class-variance-authority";
import type { HTMLAttributes } from "vue";

export interface TableProps {
  columns?: TableColumn[];
  rows?: TableRow[];
  // ---
  uiConfig?: { table: CxOptions };
  class?: HTMLAttributes["class"];
}

export interface TableColumn {
  label: string;
  emphasis?: boolean;
}

export interface TableRow {
  cells: string[];
}

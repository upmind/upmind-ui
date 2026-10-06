// -----------------------------------------------------------------------------
/**
 * @module portal/fixtures/metric
 * @description Sample data for the `metric` module (tasks.md 5.7).
 */

import type { StatItem } from "@upmind/ui";
// -----------------------------------------------------------------------------

export const METRIC_FIXTURE: readonly StatItem[] = [
  { label: "Active services", value: "6", description: "Across 1 domain" },
  { label: "Next invoice", value: "€54.00", description: "Due 24 Jun 2026" },
  {
    label: "Account credit",
    value: "€10.00",
    description: "Applied automatically"
  },
  { label: "Open tickets", value: "1", description: "Last reply 2h ago" }
];

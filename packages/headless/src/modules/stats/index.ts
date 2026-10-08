// -----------------------------------------------------------------------------
/**
 * @module stats
 * @description The client dashboard stats data layer — ONE composable,
 * `useStats`, carrying the four stat-count tiles and the Upmind-usage refusal
 * read. Read-only; no machine, no manager. SELF context only.
 *
 * This barrel is the module's ONLY public surface — `stats.services.ts`,
 * `.mappers.ts` and `.utils.ts` each carry a line-1 internal marker and are
 * never imported directly by another module. Curated named re-exports only;
 * no `export *`.
 */

// --- Composable
export { useStats, type UseStats } from "./useStats";

// --- Scope matrix — SELF only, public
export { STATS_SCOPE_MATRIX } from "./stats.types";
export type { StatsScopeMatrix } from "./stats.types";

// --- Public model types
export { StatType } from "./stats.types";
export { BACKEND_DATE_FORMAT } from "./stats.utils";
export type { PackageLimits, StatsData, UpmindUsageData } from "./stats.types";

// --- Sub-composable type exports for consumers
export type { UseStatsActions } from "./useStats.actions";
export type { UseStatsContext } from "./useStats.context";
export type { UseStatsMeta } from "./useStats.meta";
export type { UseStatsInternals } from "./useStats.internals";

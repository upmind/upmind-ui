import {
  CLIENT_EMAIL_SCENARIO,
  CLIENT_EMAILS_SCENARIO
} from "./modules/client-email/client-email.types";
import { useClientEmailManager, useClientEmails } from "./modules/client-email";
// -----------------------------------------------------------------------------
/**
 * @module scenarios
 * @description The keyed map of every composable a scenario executor may boot,
 * self-registered one module at a time (ruling F-1). Reached ONLY as
 * `@upmind-automation/headless/scenarios` — it is deliberately absent from
 * `src/index.ts`, so the main barrel never carries it and a consumer cannot
 * acquire it by accident.
 *
 * Module barrels are imported directly here rather than through `src/index.ts`,
 * so this entry point constructs no `useUpmind` singleton.
 *
 * Each value is a boot THUNK, never an invoked builder: enumerating the map
 * must not instantiate a scope. The consumer's own registry supplies scope,
 * pairing and handoff (S-D4).
 */
// -----------------------------------------------------------------------------

const scenarios = {
  [CLIENT_EMAILS_SCENARIO]: () => useClientEmails(),
  [CLIENT_EMAIL_SCENARIO]: () => useClientEmailManager()
} as const;

/**
 * The keys themselves, re-exported HERE and nowhere else. A consumer's registry
 * names a key and boots a thunk through ONE specifier, and the main barrel's
 * curated surface stays exactly what it was.
 */
export { CLIENT_EMAIL_SCENARIO, CLIENT_EMAILS_SCENARIO };

/** The union of every registered scenario key — a registry must cover it exactly. */
export type ScenarioKey = keyof typeof scenarios;

export default scenarios;

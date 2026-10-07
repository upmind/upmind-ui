// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — the declaration of a RECORD page (D26). Doctrine wins over
 * this skeleton and the one built page it cites. Authority:
 * `playgrounds/labs-nuxt/modules/scenarios/runtime/scenario.types.ts` and
 * `playgrounds/labs-nuxt/modules/scenarios/docs/record.md`.
 *
 * Emitted by the DEVELOPER seat, into the scenario's own directory. Use this
 * file INSTEAD of `{module}.scenario.ts` when the module ships a single-record
 * manager: a manager is never given a custom `*.page.vue`.
 */

import { useModuleManager } from "@upmind-automation/headless";
import { moduleRecord } from "./module.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------
/**
 * @module scenarios/useModuleManager/module.scenario
 * @description THE declaration for a record page: the manager that boots, the
 * param that addresses one record, the feature tags the page plays, and the
 * one record declaration that draws it.
 *
 * `useList` and `useMutate` stay OMITTED — the manager draws as a RECORD, and
 * naming either routes the page to the wrong archetype.
 *
 * @reference `playgrounds/labs-nuxt/modules/scenarios/useContractProduct/` —
 * read while authoring this skeleton, never a match target.
 */

/** This scenario's key — the identity the world and the page registry name it by. */
export const MODULES_SCENARIO = "module";

export default {
  key: MODULES_SCENARIO,
  useManage: useModuleManager,
  // UUID-shaped on purpose and OPTIONAL: the scope suffix (`/as/client`)
  // follows the id, and an unpatterned param resolves `as` as the id. With no
  // id the page draws the picker (D33).
  params: ["id([0-9a-fA-F-]{36})?"],
  // The module's own name; `without` lists the tags another page of the same
  // feature plays (a collection page's `@collection`). Omit it where one page
  // plays the whole feature.
  tracks: { module: "module", without: ["@collection"] },
  presentation: {
    // D17: a lucide name that RESOLVES — never shipped as this placeholder.
    icon: "icon-name",
    record: moduleRecord
  }
} satisfies ScenarioDeclaration;

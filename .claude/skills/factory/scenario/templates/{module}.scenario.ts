// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and the one built page it
 * cites. Authority:
 * `playgrounds/labs-nuxt/modules/scenarios/runtime/scenario.types.ts`
 * and this set's `CHANNELS.md`. A disagreement between the skeleton, the
 * reference page and the contract is a surfaced finding, never silently
 * resolved toward either.
 *
 * Emitted by the DEVELOPER seat, into the scenario's own directory under
 * `playgrounds/labs-nuxt/modules/scenarios/`.
 */

import { useModuleManager, useModules } from "@upmind-automation/headless";
import {
  actionsUischema,
  cardUischema,
  tableUischema
} from "./module.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------
/**
 * @module scenarios/useModules/module.scenario
 * @description THE declaration for this module — one module, ONE file: which
 * composables boot, which module's spec the page plays, and how the whole thing
 * draws. Everything else is READ from the composables named here, so nothing in
 * this file can disagree with the module.
 *
 * The directory name IS the url segment and the route name, so nothing here
 * declares a route and nothing can misname one.
 *
 * What is deliberately NOT declared is the point of the declaration: the boot
 * scope (the page boots as self with no context, and only the url moves it),
 * the scope matrix (the composable exports its own), the filter bar and the
 * sort control (the criteria schema owns both) and the editor form (the mutate
 * composable's own schemas). `CHANNELS.md`'s "Not channels" table is the whole
 * list and where each fact actually lives.
 *
 * `presentation.icon` is the ONE field neither asked nor derived: the token
 * below is a placeholder the author replaces with this module's icon name.
 *
 * @reference `playgrounds/labs-nuxt/modules/scenarios/` — the one built page,
 * read while authoring this skeleton, never a match target.
 */

/** This scenario's key — the identity the world and the page registry name it by. */
export const MODULES_SCENARIO = "modules";

/**
 * `useList` and `useMutate` are each optional and AT LEAST ONE is required —
 * with neither there is no playground to build, and the door refuses the run.
 * Which are present decides the surface: collection, editor, or both.
 *
 * `tracks` is the module's own NAME and nothing else. The page reads that
 * module's feature text, its step catalog and its recorded bodies from
 * headless's published test entry at this key; the declaration imports no
 * artefact, and a module is published there the moment its `__tests__/` keeps
 * the layout.
 */
export default {
  key: MODULES_SCENARIO,
  useList: useModules,
  useMutate: useModuleManager,
  tracks: "module",
  presentation: {
    icon: "icon-name",
    table: tableUischema,
    card: cardUischema,
    actions: actionsUischema
  }
} satisfies ScenarioDeclaration;

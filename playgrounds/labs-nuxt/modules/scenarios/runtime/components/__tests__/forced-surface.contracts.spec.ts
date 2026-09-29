// @vitest-environment happy-dom
/**
 * @module scenarios/runtime/components/__tests__/forced-surface.contracts.spec
 * @description FE-3029 — the contracts list page under each preset its own
 * recordings can answer. The claims live in `forced-surface.harness.ts`.
 */

import declaration from "../../../useContracts/contracts.scenario";
import { proveForcedSurface } from "./forced-surface.harness";

await proveForcedSurface(declaration);

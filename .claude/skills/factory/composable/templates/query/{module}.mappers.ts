/** @internal */
// TEMPLATE FILE — scaffolded by the factory; replace every placeholder.
import { castArray, map } from "lodash-es";
import type { {Module} } from "./module.types";
import type { I{Module} } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module module/module.mappers
 * @description Module wire ↔ view-model mappers.
 */

export const map{Module} = (raw: I{Module}): {Module} => ({ id: raw.id });

export const map{Module}s = (raw: I{Module} | I{Module}[]): {Module}[] =>
  map(castArray(raw), map{Module});

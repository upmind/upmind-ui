/** @internal */
// TEMPLATE FILE — scaffolded by the factory; replace every placeholder.
import type { ModuleModel } from "./module.types";
// -----------------------------------------------------------------------------
/**
 * @module module/module.mappers
 * @description Module model ↔ request-body mappers.
 */

export function mapModuleRequestData(
  model: ModuleModel
): Record<string, unknown> {
  return { ...model };
}

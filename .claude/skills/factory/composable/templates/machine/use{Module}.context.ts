// TEMPLATE FILE — scaffolded by the factory; replace every placeholder.
import { useContext } from "../../utils";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
import type { ModuleModel } from "./module.types";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.context
 * @description Module context factory.
 */

export function createModuleContext(
  actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  const errors = useContext<ResponseError["message"]>(state, "error.message");
  const lookups = useContext<Record<string, unknown>[]>(state, "lookups", []);
  const model = useContext<ModuleModel>(state, "model");

  return {
    /** Error message from the last failed service call. */
    errors,

    /** Reference data every actor needs. */
    lookups,

    /** The active form model. */
    model
  };
}

export type UseModuleContext = ReturnType<typeof createModuleContext>;

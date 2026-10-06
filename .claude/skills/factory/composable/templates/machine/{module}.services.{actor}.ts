/** @internal */
// TEMPLATE FILE — scaffold only when this actor earns a services arm (ARMS.md).
import { useQuery } from "../query";
import { mapModuleRequestData } from "./module.mappers";
import type { ModuleContext, ModuleServices } from "./module.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module module/module.services.client
 * @description Client-specific module machine services.
 */

async function register(
  { model = {} }: ModuleContext,
  _event: AnyEventObject
): Promise<unknown> {
  const { post, useUrl } = useQuery();

  return post({
    mutationKey: ["module", "register"],
    url: useUrl("module-items/register"),
    data: mapModuleRequestData(model),
    withAccessToken: true
  });
}

async function registerAsGuest(
  _context: ModuleContext,
  _event: AnyEventObject
): Promise<unknown> {
  const { post, useUrl } = useQuery();

  return post({
    mutationKey: ["module", "register-guest"],
    url: useUrl("module-items/register-guest"),
    withAccessToken: true
  });
}
// -----------------------------------------------------------------------------
export function createClientModuleServices(): Partial<ModuleServices> {
  return {
    register,
    registerAsGuest
  };
}

/** @internal */
// TEMPLATE FILE — scaffolded by the factory; replace every placeholder.
import { useI18n } from "../system-localisation";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useModelParser,
  useValidation
} from "../../utils";
import { isEmpty } from "lodash-es";
import type { ScopeActorTypes } from "../scope";
import type {
  ModuleContext,
  ModuleModel,
  ModuleServices
} from "./module.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module module/module.services
 * @description Module machine services and the machine services map.
 */

async function login(
  { model }: ModuleContext,
  _event: AnyEventObject
): Promise<unknown> {
  return model;
}

async function parse(
  { model = {}, schema }: ModuleContext,
  _event: AnyEventObject
): Promise<ModuleModel> {
  if (!schema) return model;
  return useModelParser(schema, model);
}

async function validate(
  { model, schema }: ModuleContext,
  _event: AnyEventObject
): Promise<ModuleModel | undefined> {
  if (!schema) return model;

  const errors = useValidation().validate(schema, model);
  if (isEmpty(errors)) return model;

  const { t } = useI18n();
  return Promise.reject(
    new DetailedError(
      t("error.module_validation_failed"),
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless,
      errors
    )
  );
}
// -----------------------------------------------------------------------------
function scopedServices(scopeActor: ScopeActorTypes): Partial<ModuleServices> {
  switch (scopeActor) {
    default:
      return {};
  }
}

export const moduleMachineServices = {
  login,
  parse,
  register: (context: ModuleContext, event: AnyEventObject) =>
    scopedServices(context.scopeActor as ScopeActorTypes).register?.(
      context,
      event
    ) ??
    Promise.reject(
      new DetailedError(
        useI18n().t("error.module_forbidden"),
        responseCodes.Forbidden,
        ErrorOrigin.Headless
      )
    ),
  registerAsGuest: (context: ModuleContext, event: AnyEventObject) =>
    scopedServices(context.scopeActor as ScopeActorTypes).registerAsGuest?.(
      context,
      event
    ) ??
    Promise.reject(
      new DetailedError(
        useI18n().t("error.module_forbidden"),
        responseCodes.Forbidden,
        ErrorOrigin.Headless
      )
    ),
  validate
};

export default moduleMachineServices;

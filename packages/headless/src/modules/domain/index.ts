// --- external
import { interpret, InterpreterStatus } from "xstate";

// --- internal
import domainMachine from "./domain.machine";
import { DomainTypes } from "./types";
export * from "./types";
export * from "./useDomain";

// --- utils
import { stopService } from "../../utils";
import { parseDomain } from "./utils";
import { has, map, isArray, some } from "lodash-es";

// --- types
import type { InterpreterFrom } from "xstate";

// -----------------------------------------------------------------------------
export const useDomain = (
  {
    model,
    type,
  }: {
    model?: string | string[];
    type?: DomainTypes;
  } = {
    model: [],
    type: undefined,
  }
) => {
  // ---  // create a new instance of the  domain machine

  // safetycheck to ensure forcedType is valid
  const safeType = type && has(DomainTypes, type) ? type : null;
  const safeModel = map(isArray(model) ? model : [model], parseDomain);

  // ---
  const context = {
    type: safeType,
    choices: safeType ? null : DomainTypes,
    model: safeModel,
  };

  const service = interpret(domainMachine.withContext(context as any), {
    devTools: false,
  }).start();

  // ---------------------------------------------------------------------------

  // ---
  const choose = (value: string) =>
    service.send({
      type: "CHOOSE",
      data: value,
    });

  const search = (query: string) => {
    service.send({ type: "SEARCH", data: query });
  };

  const searchMore = () => {
    service.send({ type: "SEARCH.OFFSET" });
  };

  const toggle = (value: string) => {
    const state = service.getSnapshot();
    const type = some(state, [".context.model.domain", value])
      ? "REMOVE"
      : "ADD";
    service.send({
      type,
      data: value,
    });
  };

  const update = (model: string | Array<string>) => {
    // NB: nsure we have an array of strings
    service.send({
      type: "UPDATE",
      data: isArray(model) ? model : [model],
    });
  };

  const reset = () => {
    service.send({
      type: "RESET",
    });
  };

  const add = (value: string) => {
    service.send({
      type: "ADD",
      data: value,
    });
  };

  const remove = (value: string) => {
    service.send({
      type: "REMOVE",
      data: value,
    });
  };

  const select = (value: string) =>
    service.send({
      type: "SELECT",
      data: value,
    });

  const addToBasket = () => {
    service.send({
      type: "ADD_UPDATE_MANY",
    });
  };

  // ---------------------------------------------------------------------------
  return {
    service, // allow for interpreting the machine + inspecting it
    getSnapshot: service.getSnapshot,
    // ---
    choose,
    search,
    searchMore,
    toggle,
    update,
    reset,
    add,
    remove,
    select,
    addToBasket,
    // ---
    isSelected: (value: string) => {
      const state = service.getSnapshot();
      const valid = some(state.context.model, { domain: value });
      return valid;
    },
    stop: () => stopService(service as InterpreterFrom<any>),
  };
};

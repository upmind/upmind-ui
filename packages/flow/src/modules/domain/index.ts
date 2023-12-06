// --- external
import { interpret } from "xstate";

// --- internal
import domainMachine from "./domain.machine";
import { DomainTypes } from "./types.d";

// --- utils
import { has } from "lodash-es";

// --------------------------------------------------------

export const useDomain = (type?: DomainTypes) => {
  // --------------------------------------------------------
  // create a new instance of the domain machine
  // NB dont automatically start the machine as in order for the inspector to work
  // it needs to be started after the inspect service is created, so we only start it when we need it

  let state = null;

  // safetycheck to ensure forcedType is valid
  type = type && has(DomainTypes, type) ? type : null;

  const context = {
    choices: type ? null : DomainTypes,
    type,
    values: [],
    available: [],
    total: 0,
    // ---
    search: null,
    currency: null,
    promotions: [],
    limit: 10,
    offset: 0,
    controller: null,
    // ---
    error: null
  };

  const service = interpret(domainMachine.withContext(context), {
    context,
    devTools: true
  })
    .onTransition(newState => (state = newState))
    .start();

  // --------------------------------------------------------
  // methods

  // --------------------------------------------------------

  return {
    service, // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: () => state
  };
};

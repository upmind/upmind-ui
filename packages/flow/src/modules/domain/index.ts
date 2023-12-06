// --- external
import { interpret } from "xstate";

// --- internal
import domainMachine from "./domain.machine";
import type { DomainTypes } from "./types";

// --- utils
// import { set, get } from "lodash-es";

// --------------------------------------------------------

export const useDomain = (forceType?: DomainTypes) => {
  // --------------------------------------------------------
  // create a new instance of the domain machine
  // NB dont automatically start the machine as in order for the inspector to work
  // it needs to be started after the inspect service is created, so we only start it when we need it

  let state = null;

  const service = interpret(domainMachine(forceType), {
    devTools: true
  }).onTransition(newState => (state = newState));

  // --------------------------------------------------------
  // methods

  // --------------------------------------------------------

  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: () => state
  };
};

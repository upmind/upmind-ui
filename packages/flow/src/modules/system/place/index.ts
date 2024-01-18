// --- external
import { interpret } from "xstate";

// --- internal
import placeMachine from "./place.machine";
// import placesMachine from "./places.machine";

// --- utils

// --- types

// --------------------------------------------------------

// system places is NOT a global insance, and is always instantiated as a new machine
// this is because we need to be able to have multiple places happening at once
// and we need to be able to start and stop them individually
export const useSystemPlaces = () => {
  let state = null;

  const service = interpret(placeMachine, { devTools: true })
    .onTransition(newState => (state = newState))
    .start();

  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: () => state,
    destroy: () => service.stop()
  };
};

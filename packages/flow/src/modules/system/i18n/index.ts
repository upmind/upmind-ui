// --- external
import { interpret } from "xstate";

// --- internal
import i18nMachine from "./i18n.machine";

// --- utils

// --- types

// --------------------------------------------------------

// system i18ns is NOT a global insance, and is always instantiated as a new machine
// this is because we need to be able to have multiple i18ns happening at once
// and we need to be able to start and stop them individually
export const useI18n = (activeLocale = "en") => {
  let state = null;

  const context = {
    activeLocale,
  };

  const service = interpret(i18nMachine.withContext(context), {
    devTools: true,
  })
    .onTransition(newState => (state = newState))
    .start();

  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: () => state,
    destroy: () => service.stop(),
  };
};

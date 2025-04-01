// --- external
import { interpret, InterpreterStatus } from "xstate";

// --- internal
import uploadMachine from "./upload.machine";

// --- utils

// --- types

// ---
// system uploads is NOT a global insance, and is always instantiated as a new machine
// this is because we need to be able to have multiple uploads happening at once
// and we need to be able to start and stop them individually

export const useSystemUpload = (field?: object) => {
  const context = {
    field,
  };

  const service = interpret(uploadMachine.withContext(context as any), {
    devTools: false,
  });

  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: service.getSnapshot,
    stop: () => service.status == InterpreterStatus.Running && service.stop(),
  };
};

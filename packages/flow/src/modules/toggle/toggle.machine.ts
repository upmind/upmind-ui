import { createMachine, assign } from "xstate";
import type { ToggleContext, ToggleEvents } from "./types";

export const machineConfig = {
  id: "toggle",
  predictableActionArguments: true,
  initial: "inactive",
  context: {
    count: 0
  },
  states: {
    inactive: {
      on: {
        TOGGLE: [
          {
            target: "disabled",
            cond: (context: ToggleContext) => context.count >= 3
          },
          {
            target: "active",
            actions: ["increment"]
          }
        ]
      }
    },
    active: {
      on: {
        TOGGLE: [
          {
            target: "disabled",
            cond: (context: ToggleContext) => context.count >= 3
          },
          {
            target: "inactive"
          }
        ]
      }
    },
    disabled: {
      on: {
        RESET: {
          target: "inactive",
          actions: ["reset"]
        }
      }
    }
  }
};

const machine = createMachine<ToggleContext, ToggleEvents>(machineConfig, {
  actions: {
    increment: assign<ToggleContext, ToggleEvents>({
      count: context => context.count + 1
    }),
    reset: assign<ToggleContext, ToggleEvents>({
      count: 0
    })
  }
});

export default machine; // allow for independent instance creation

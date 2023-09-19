import { createMachine, assign, interpret } from "xstate";
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
            actions: ["log"],
            cond: (context: ToggleContext) => context.count >= 3
          },
          {
            target: "active",
            actions: ["log", "increment"]
          }
        ]
      }
    },
    active: {
      on: {
        TOGGLE: [
          {
            target: "disabled",
            actions: ["log"],
            cond: (context: ToggleContext) => context.count >= 3
          },
          {
            target: "inactive",
            actions: ["log"]
          }
        ]
      }
    },
    disabled: {
      on: {
        RESET: {
          target: "inactive",
          actions: ["log", "reset"]
        }
      }
    }
  }
};

const machine = createMachine<ToggleContext, ToggleEvents>(machineConfig, {
  actions: {
    log: (context, event) => {
      console.log(context, event);
    },
    increment: assign<ToggleContext, ToggleEvents>({
      count: context => context.count + 1
    }),
    reset: assign<ToggleContext, ToggleEvents>({
      count: 0
    })
  }
});

export default machine; // allow for independent instance creation

export const service = interpret(machine, { devTools: true }).start(); // allow for global/shared instance creation

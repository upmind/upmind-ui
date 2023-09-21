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
      id: "inactive",
      initial: "idle",
      states: {
        idle: {
          always: {
            target: "#disabled",
            cond: (context: ToggleContext) => context.count >= 3
          },
          on: {
            TOGGLE: {
              target: "processing",
              actions: ["increment"]
            }
          }
        },
        processing: {
          after: {
            500: "#active"
          }
        }
      }
    },
    active: {
      id: "active",
      initial: "idle",
      states: {
        idle: {
          always: {
            target: "#disabled",
            cond: (context: ToggleContext) => context.count >= 3
          },
          on: {
            TOGGLE: {
              target: "processing",
              actions: ["increment"]
            }
          }
        },
        processing: {
          after: {
            500: "#inactive"
          }
        }
      }
    },
    disabled: {
      id: "disabled",
      initial: "idle",
      states: {
        idle: {
          on: {
            RESET: {
              target: "processing",
              actions: ["reset"]
            }
          }
        },
        processing: {
          after: {
            1000: "#inactive"
          }
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

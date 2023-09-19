import { createMachine, assign } from "xstate";
import type { ToggleContext, ToggleEvents } from "./types";
const toggleMachine = createMachine<ToggleContext, ToggleEvents>(
  {
    id: "machine",
    predictableActionArguments: true,
    initial: "inactive",
    context: {
      count: 0
    },
    states: {
      inactive: {
        on: {
          TOGGLE: {
            target: "active",
            actions: ["log", "increment"]
          }
        }
      },
      active: {
        on: {
          TOGGLE: [
            {
              target: "disabled",
              actions: ["log"],
              cond: (context: ToggleContext, event: ToggleEvents) =>
                context.count >= 3
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
  },
  {
    actions: {
      log: (context, event) => {
        console.log(context, event);
      },
      increment: assign<ToggleContext, ToggleEvents>({
        count: (context, event) => context.count + 1
      }),
      reset: assign<ToggleContext, ToggleEvents>({
        count: (context, event) => 0
      })
    }
  }
);

export default toggleMachine;

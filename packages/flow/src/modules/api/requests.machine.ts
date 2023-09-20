import { createMachine } from "xstate";
// ---
import actions from "./actions";
import services from "./services";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./requests.machine.typegen").Typegen0,
    id: "requestsManager",
    predictableActionArguments: true,
    initial: "idle",
    context: {
      requests: {},
      cache: {}
    },
    states: {
      idle: {},
      active: {
        on: {
          CANCEL: {
            actions: ["forward"]
          },
          RETRY: {
            actions: ["forward"]
          },
          REMOVE: {
            actions: ["remove"]
          }
        }
      },
      complete: {
        type: "final"
      }
    },
    on: {
      ADD: {
        actions: ["add"]
      }
    }
  },
  {
    actions,
    services
  }
);

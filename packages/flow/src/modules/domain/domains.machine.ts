// --- external
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";

// --- utils
import { isEmpty, set, get, unset } from "lodash-es";

// --- types
import type { DomainsContext, AddEvent, RemoveEvent } from "./types";

// --------------------------------------------------------

export default createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QCcwEcCucAusCyAhgHYEzIDEAggCLUDaADALqKgAOA9rAJbbcdFWIAB6IA7GIB0AZjEAWaXIBM0hmICcS9XICsAGhABPRAEYlAX3MHUmHPmKkwySQQDGfAG5hyAYUoA5HwBRABlGFiQQTh4+ASFRBAA2HUl1aR0dXQkdeTlE9QNjBDl1E0lEk3UxRIYGHRNExWlLa3QsWFxCEjIXd24vcgAlIIAVQYBNcKFo3n5BSITk1PTMnLEcuTyCo0RpdUSZXQYlOuTEgA5pRRaQG3bOhx63T29hvAB5ADUgqciZ2PmoEWKQyeXOYhM6yuDEhhV2MMkamO5xMaiq0iUcksVhARA4EDgQjudi6jmQ0y4sziC0QAFoTHCENpJEp5GI9nJzjp1DoGGkbsSOvZuk5JNwIAAbMAUmJzeKIc5ySRmHSJZRaMRqNViRmYpSSHTnJEZaSQk6GgVtEmPUXPfrSv6UgHyhDVSTnc41HJqpSJE4oxncsrnbQlHmyQ31S22IWknquDgAWzYUuwDvYTrlNOKOp2CBMKINVWSnIYeSUmKx2KAA */
    tsTypes: {} as import("./domains.machine.typegen").Typegen0,
    id: "domainsManager",
    predictableActionArguments: true,
    initial: "empty",
    context: {
      domains: {}
    } as DomainsContext,
    states: {
      // our initial state depends on if the machine has any domains
      // If we have context > domains, we can skip to processing
      // otherwise we will await a domain
      // individual domain events are defined to allow for more granular control
      empty: {
        always: [{ target: "processing", cond: "hasDomains" }]
      },
      processing: {
        always: [{ target: "empty", cond: "hasNoDomains" }],
        on: {
          CANCEL: {
            actions: ["cancel"]
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
      },
      REMOVE: {
        actions: ["remove"]
      },
      STOP: {
        target: "complete"
      }
    }
  },
  {
    actions: {
      add: assign({
        domains: ({ domains }: DomainsContext, { data }: AddEvent) => {
          // check if we already have the domain
          const instance = get(domains, data.domain);

          // if we dont then add it to our list of domains
          if (!instance) set(domains, data.domain, data);

          return domains;
        }
      }),

      remove: assign({
        domains: ({ domains }: DomainsContext, { data }: RemoveEvent) => {
          // check if we have the domain
          const domain = get(domains, data);

          // if we do, remove it from our list of domains
          if (domain) unset(domains, data);

          return domains;
        }
      })
    },

    guards: {
      hasDomains: ({ domains }) => {
        return !isEmpty(domains);
      },
      hasNoDomains: ({ domains }) => {
        return isEmpty(domains);
      }
    },
    services
  }
);

/** @internal */
import { assign, createMachine } from "xstate";
import { AuthEvents } from "../session-store";
import { persistTokenToStorage } from "../session-store/session-store.utils";
import { useI18n } from "../system-localisation";
import {
  isLinkExpired,
  mapVerifyRegistrationError,
  toSafeRedirect
} from "./auth.mappers";
import { useSetPasswordSchema, useSetPasswordUischema } from "./auth.schemas";
import {
  completeRegistration,
  verifyRegistrationLink
} from "./auth.services.client.registration";
import { ErrorOrigin, responseCodes, useValidation } from "../../utils";
import { isEmpty } from "lodash-es";
import type {
  VerifyRegistrationContext,
  VerifyRegistrationError
} from "./auth.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module auth/registration.machine
 * @description Registration-activation landing machine: checks the link,
 * verifies it, collects a password when the account has none, and completes
 * the registration. It never navigates.
 *
 * WARNING: Do not import directly. Use via useVerifyRegistration only.
 */
// -----------------------------------------------------------------------------
/**
 * The local invalid-link error, for a missing link value or a past expiry.
 * @private
 */
function invalidLinkError(): VerifyRegistrationError {
  const { t } = useI18n();
  return {
    code: responseCodes.Bad_Request,
    data: null,
    message: t("error.session_verify_link_invalid"),
    origin: ErrorOrigin.Headless,
    status: responseCodes.Bad_Request
  };
}

/**
 * Build a fresh machine context, with the set-password form for `username`.
 * @internal
 */
export function createVerifyRegistrationMachineContext(
  username = ""
): VerifyRegistrationContext {
  return {
    params: {},
    model: { username },
    validationErrors: [],
    schema: useSetPasswordSchema(username),
    uischema: useSetPasswordUischema()
  };
}
// -----------------------------------------------------------------------------
export const verifyRegistrationMachine = createMachine(
  {
    id: "verifyRegistration",
    predictableActionArguments: true,
    initial: "idle",
    context: createVerifyRegistrationMachineContext(),

    on: {
      RESET: { target: ".checkingLink", actions: ["clearOutcome"] }
    },

    states: {
      idle: {
        on: {
          VERIFY: { target: "checkingLink", actions: ["setParams"] },
          RESET: {}
        }
      },

      checkingLink: {
        entry: ["setRedirect"],
        always: [
          {
            target: "expiredOrInvalid",
            cond: "isLinkIncomplete",
            actions: ["setInvalidLinkError"]
          },
          { target: "verifying" }
        ]
      },

      verifying: {
        invoke: {
          src: "verifyRegistrationLink",
          onDone: { target: "routing", actions: ["setData"] },
          onError: { target: "expiredOrInvalid", actions: ["setError"] }
        }
      },

      routing: {
        always: [
          { target: "completing", cond: "hasPassword" },
          { target: "checkingExpiry" }
        ]
      },

      checkingExpiry: {
        always: [
          {
            target: "expiredOrInvalid",
            cond: "isExpired",
            actions: ["setInvalidLinkError"]
          },
          { target: "needsPassword" }
        ]
      },

      needsPassword: {
        on: {
          SET: { actions: ["setModel", "clearValidationErrors"] },
          COMPLETE: { target: "validating", actions: ["validate"] }
        }
      },

      validating: {
        always: [
          { target: "needsPassword", cond: "hasValidationErrors" },
          { target: "completingWithPassword" }
        ]
      },

      completing: {
        invoke: {
          src: "completeRegistration",
          onDone: {
            target: "success",
            actions: ["persistSession", "setSession"]
          },
          onError: { target: "completionFailed", actions: ["setError"] }
        }
      },

      completingWithPassword: {
        invoke: {
          src: "completeRegistration",
          onDone: {
            target: "success",
            actions: ["persistSession", "setSession"]
          },
          onError: { target: "expiredOrInvalid", actions: ["setError"] }
        }
      },

      success: {},

      expiredOrInvalid: {},

      completionFailed: {}
    }
  },
  {
    actions: {
      setParams: assign(
        (_context: VerifyRegistrationContext, { data }: AnyEventObject) => {
          const username = data?.username ?? "";
          return {
            params: data ?? {},
            model: { username },
            schema: useSetPasswordSchema(username)
          };
        }
      ),

      setRedirect: assign({
        redirect: ({ params }: VerifyRegistrationContext) =>
          toSafeRedirect(params.redirect)
      }),

      setInvalidLinkError: assign({ error: () => invalidLinkError() }),

      setData: assign({
        data: (_context: VerifyRegistrationContext, { data }: AnyEventObject) =>
          data
      }),

      setError: assign({
        error: (
          _context: VerifyRegistrationContext,
          { data }: AnyEventObject
        ) => mapVerifyRegistrationError(data)
      }),

      setModel: assign({
        model: (
          { model }: VerifyRegistrationContext,
          { data }: AnyEventObject
        ) => ({ ...model, ...data })
      }),

      validate: assign({
        validationErrors: ({ model, schema }: VerifyRegistrationContext) => {
          const errors = useValidation().validate(schema, model);
          if (model.password_confirmation === model.password) return errors;
          return [
            ...errors,
            {
              instancePath: "/password_confirmation",
              schemaPath: "#/properties/password_confirmation/const",
              keyword: "const",
              params: { allowedValue: model.password }
            }
          ];
        }
      }),

      persistSession: (
        _context: VerifyRegistrationContext,
        { data }: AnyEventObject
      ) => {
        persistTokenToStorage(data, { event: AuthEvents.LOGIN });
      },

      clearValidationErrors: assign({ validationErrors: () => [] }),

      setSession: assign({
        sessionId: (
          _context: VerifyRegistrationContext,
          { data }: AnyEventObject
        ) => data?.actor_id
      }),

      clearOutcome: assign(({ params }: VerifyRegistrationContext) => ({
        data: undefined,
        error: undefined,
        redirect: undefined,
        sessionId: undefined,
        validationErrors: [],
        model: { username: params.username ?? "" }
      }))
    },

    guards: {
      isLinkIncomplete: ({ params }: VerifyRegistrationContext) =>
        !params.username || !params.hash,

      hasPassword: ({ data }: VerifyRegistrationContext) =>
        data?.needsPassword === false,

      isExpired: ({ params }: VerifyRegistrationContext) =>
        isLinkExpired(params.expires, new Date()),

      hasValidationErrors: ({ validationErrors }: VerifyRegistrationContext) =>
        !isEmpty(validationErrors)
    },

    services: {
      verifyRegistrationLink,
      completeRegistration
    }
  }
);

export default verifyRegistrationMachine;

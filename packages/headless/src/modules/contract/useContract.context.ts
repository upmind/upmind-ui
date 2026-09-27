import { computed } from "vue";
import { useContext } from "../../utils";
import { get } from "lodash-es";
import type { Contract, ContractContext, ContractForm } from "./contract.types";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type {
  CancellationRequestStatusCodes,
  ContractStatusCodes,
  IContract
} from "@upmind-automation/types";
import type { ErrorObject } from "ajv";
// -----------------------------------------------------------------------------
/**
 * @module contract/useContract.context
 * @description Manager context — the reactive read side of the machine
 * context. Every member goes through the `useContext` state-read utility;
 * `state.value.context` is never read directly. `error` is the machine's
 * captured failure — read, never raised. The ONE write form is read off its own
 * `paymentMethod` slot (`schema`/`uischema`/`model`, R35), which the machine
 * sets on the `PAYMENT_METHOD` open transition; nothing is fetched or composed
 * here.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createContractContext(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  const rawContract = useContext<IContract>(state, "rawContract");
  const contract = useContext<Contract>(state, "contract");

  /** Display title of the record — derived off the raw wire record, as `useContractProduct.context.ts`'s `title` is. */
  const title = computed(() => rawContract.value?.name ?? undefined);

  return {
    /** The cancellation-request status in the platform vocabulary; undefined when no request exists (AC12). */
    cancellationRequestStatus: useContext<CancellationRequestStatusCodes>(
      state,
      "contract.cancellationRequest.status.code"
    ),

    /** The raw `cancellation_request.status.code` string, as it arrived off the wire — next to `cancellationRequestStatus` (AC12). */
    cancellationRequestStatusCode: computed<string | undefined>(() =>
      get(rawContract.value, "cancellation_request.status.code")
    ),

    /** The mapped contract view model. */
    contract,

    /** The full machine context object. */
    context: useContext<ContractContext>(state),

    /** The contract status in the platform vocabulary (AC12). */
    contractStatus: useContext<ContractStatusCodes>(
      state,
      "contract.status.code"
    ),

    /** The raw `status.code` string, as it arrived off the wire — next to `contractStatus` (AC12). */
    contractStatusCode: computed<string | undefined>(() =>
      get(rawContract.value, "status.code")
    ),

    /** Machine-captured error, if any — read, never raised. */
    error: useContext<ResponseError>(state, "error"),

    /** Machine-captured error message, if any — read, never raised. */
    errors: useContext<ResponseError["message"]>(state, "error.message"),

    /** The id of the contract being managed. */
    id: useContext<IContract["id"]>(state, "contractId"),

    /** The reused lookups the payment-method form draws from (`loadLookups`). */
    lookups: useContext<ContractContext["lookups"]>(state, "lookups"),

    /**
     * The open payment-method form: `schema`, `uischema` and the parsed `model`
     * (R35), set on the `PAYMENT_METHOD` open transition and offering the
     * client's stored payment methods. A surface renders it and submits its
     * model through `update`; the machine parses and validates against its
     * schema.
     */
    paymentMethod: useContext<ContractForm | undefined>(state, "paymentMethod"),

    /** The raw `IContract` API response beside the view model. */
    rawContract,

    /** Display title of the record. */
    title,

    /** Field-level validation errors (AJV `ErrorObject[]`) — read, never raised. */
    validationErrors: useContext<ErrorObject[]>(state, "error.data")
  };
}

export type UseContractContext = ReturnType<typeof createContractContext>;

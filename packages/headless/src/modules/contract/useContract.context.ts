import { computed } from "vue";
import { useContext } from "../../utils";
import { get } from "lodash-es";
import type { Contract, ContractWriteModel } from "./contract.types";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import type {
  CancellationRequestStatusCodes,
  ContractStatusCodes,
  IContract
} from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module contract/useContract.context
 * @description Manager context — the reactive read side of the machine
 * context. Every member goes through the `useContext` state-read utility;
 * `state.value.context` is never read directly. `error` is the machine's
 * captured failure — read, never raised. The ONE write form is read off the
 * single `schema`/`uischema`/`model` slot (auth shape), which the machine sets
 * on the `PAYMENT_METHOD` open transition; nothing is fetched or composed here.
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

    /** The id of the contract being managed. */
    id: useContext<IContract["id"]>(state, "contractId"),

    /** The open form's parsed model — set on open, re-set by `SET`/`parse`. */
    model: useContext<ContractWriteModel>(state, "model"),

    /** The raw `IContract` API response beside the view model. */
    rawContract,

    /**
     * The open payment-method form's schema (auth shape), set on the
     * `PAYMENT_METHOD` open transition and offering the client's stored payment
     * methods. A surface renders it with {@link uischema} and submits its model
     * to `submitPaymentMethod`; the machine parses and validates against it.
     */
    schema: useContext<JsonSchema7>(state, "schema"),

    /** The open payment-method form's uischema (auth shape). */
    uischema: useContext<UISchemaElement>(state, "uischema")
  };
}

export type UseContractContext = ReturnType<typeof createContractContext>;

import { computed } from "vue";
import {
  ClientCustomFieldsContextTypes,
  useClientCustomFields
} from "../client-custom-fields";
import { usePaymentDetails } from "../payment-details";
import { ScopeActorTypes } from "../scope/scope.types";
import {
  useRequestCancellationSchema,
  useRequestCancellationUischema,
  useSetPaymentMethodSchema,
  useSetPaymentMethodUischema
} from "./contract.schemas";
import { useContext } from "../../utils";
import { get } from "lodash-es";
import type { Contract } from "./contract.types";
import type { ResponseError, UseActor } from "../../utils";
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
 * captured failure — read, never raised.
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
  const { data: storedPaymentMethods } = usePaymentDetails();
  const { data: cancellationFields } = useClientCustomFields()
    .as(ScopeActorTypes.CLIENT)
    .for(ClientCustomFieldsContextTypes.CANCEL_REQUEST)
    .useContext();

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

    /** The raw `IContract` API response beside the view model. */
    rawContract,

    /**
     * One schema + uischema pair per model-taking write (R28 amendment). A
     * surface renders the pair and submits its model to the action of the
     * same name. `requestCancellation` offers this contract's own products;
     * `setPaymentMethod` offers the client's stored payment methods.
     */
    schemas: {
      requestCancellation: {
        schema: computed(() =>
          useRequestCancellationSchema({
            products: contract.value?.products,
            customFields: cancellationFields.value
          })
        ),
        uischema: computed(() =>
          useRequestCancellationUischema({
            products: contract.value?.products,
            customFields: cancellationFields.value
          })
        )
      },
      setPaymentMethod: {
        schema: computed(() =>
          useSetPaymentMethodSchema({
            storedPaymentMethods: storedPaymentMethods.value,
            paymentDetailsId: contract.value?.paymentDetailsId
          })
        ),
        uischema: computed(() => useSetPaymentMethodUischema())
      }
    }
  };
}

export type UseContractContext = ReturnType<typeof createContractContext>;

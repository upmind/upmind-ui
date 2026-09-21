import { useContext } from "../../utils";
import type { Contract } from "./contract.types";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
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

  return {
    /** The cancellation-request status in the platform vocabulary; undefined when no request exists (AC12). */
    cancellationRequestStatus: useContext<CancellationRequestStatusCodes>(
      state,
      "contract.cancellationRequest.status.code"
    ),

    /** The mapped contract view model. */
    contract: useContext<Contract>(state, "contract"),

    /** Machine-captured error, if any — read, never raised. */
    error: useContext<ResponseError>(state, "error"),

    /** The id of the contract being managed. */
    id: useContext<IContract["id"]>(state, "contractId"),

    /** The raw `IContract` API response beside the view model. */
    rawContract: useContext<IContract>(state, "rawContract"),

    /** The contract status in the platform vocabulary (AC12). */
    status: useContext<ContractStatusCodes>(state, "contract.status.code")
  };
}

export type UseContractContext = ReturnType<typeof createContractContext>;

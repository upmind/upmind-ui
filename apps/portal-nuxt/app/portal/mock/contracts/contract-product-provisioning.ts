// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/contract-product-provisioning
 * @description Four-layer contract for the `contract-product-provisioning`
 * module headless does not have yet (plan §3): one product's provisioning
 * config fields, its provider functions and its embedded iframes, plus the
 * `run(code)` verb every function button fires. Fields and functions are the
 * wire `IProvisionFieldValue` / `IProvisionRequestAction`.
 *
 * @oracle vue-app `origin/master` @ `7f259e0e12`, client area —
 * `cProdProvConfigDetails.vue`, `cProdProvActions.vue`,
 * `cProdProvIframesComp.vue`, `cProdRowWithFuncs.vue`; gap-doc rows
 * "2. Products → Overview tab", X5.
 */

import { NO_ACTOR_CONTEXT, SCOPE_ACTOR } from "./scope";
import type { ContractInternals } from "./scope";
import type {
  ActorContextMatrix,
  ResponseError
} from "@upmind-automation/headless";
import type {
  BlueprintFieldsTypes,
  IProvisionFieldValue,
  IProvisionRequestAction,
  ProvisionRequestActionTypes
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * One provider panel embedded in the product overview.
 *
 * @decision Portal-local. Searched `packages/types` for `IProvisionIframe` /
 * `IProvisionEmbed` / an iframe member on `IProvisionConfiguration` — none
 * exist; legacy composes the frame from a `RENDER_IFRAME` action's params.
 */
export type ProvisionIframe = {
  /** The action this frame was rendered from. */
  id: IProvisionRequestAction["id"];
  /** Accessible name for the frame. */
  name: IProvisionRequestAction["name"];
  /** The document the frame loads. */
  url: string;
};

/**
 * One blueprint field a client answers before the product goes live.
 *
 * @decision Portal-local. `IProvisionFieldValue` is the ANSWER alone — the
 * label, the type and whether the provider insists on it hang off
 * `IBlueprintField`, which the client-facing read never carries; searched
 * `packages/types` for a paired model and found none.
 */
export type ProvisioningSetupField = {
  /** The provider's own key for it — what the answer is stored against. */
  code: string;
  label: string;
  /** How it is answered; absent reads as free text. */
  type?: BlueprintFieldsTypes;
  /** The provider will not provision without it. */
  required?: boolean;
  /** Masked as it is typed — a password, an API key. */
  secret?: boolean;
  /** The fixed choices it offers, where it offers any. */
  options?: readonly { label: string; value: string }[];
  value?: IProvisionFieldValue["value"];
};

/** What the setup form is handed — the blueprint this product is provisioned from. */
export type ProvisioningSetupContext = {
  fields: readonly ProvisioningSetupField[];
};

/** What the setup form writes — one answer per field code. */
export type ProvisioningSetupModel = Record<
  ProvisioningSetupField["code"],
  IProvisionFieldValue["value"]
>;

/**
 * What running a provider function resolved to — one arm per legacy outcome
 * (`ProvisionRequestActionTypes`). The consumer navigates, posts, re-reads
 * its fields or opens a frame; the module renders nothing.
 */
export type ProvisionFunctionResult =
  | {
      type: ProvisionRequestActionTypes.DISPLAY_RETURN_FIELDS;
      fields: IProvisionFieldValue[];
    }
  | { type: ProvisionRequestActionTypes.REDIRECT; url: string }
  | {
      type: ProvisionRequestActionTypes.FORM_POST;
      url: string;
      params: Record<string, string>;
    }
  | {
      type: ProvisionRequestActionTypes.REFRESH_FIELDS;
      fields: IProvisionFieldValue[];
    }
  | {
      type: ProvisionRequestActionTypes.RENDER_IFRAME;
      iframe: ProvisionIframe;
    };

// -----------------------------------------------------------------------------
// SCOPE
// -----------------------------------------------------------------------------

/** Context types for the provisioning read — which product is addressed. */
export const ContractProductProvisioningContextTypes = {
  /** Reading one contract product's provisioning surface. */
  CONTRACT_PRODUCT: "contract-product"
} as const;

export type ContractProductProvisioningContextTypes =
  (typeof ContractProductProvisioningContextTypes)[keyof typeof ContractProductProvisioningContextTypes];

/**
 * Scope matrix for `useContractProductProvisioning`. `client` is the only
 * actor that resolves; the portal mock has no staff or guest surface (plan §6).
 */
export const CONTRACT_PRODUCT_PROVISIONING_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]:
    ContractProductProvisioningContextTypes.CONTRACT_PRODUCT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useContractProductProvisioning`. */
export type ContractProductProvisioningScopeMatrix =
  typeof CONTRACT_PRODUCT_PROVISIONING_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// LAYERS — useContractProductProvisioning
// -----------------------------------------------------------------------------

/** Provisioning context — the three surfaces the overview renders. */
export type UseContractProductProvisioningContext = {
  /** The product's provisioning config fields, in provider order. */
  fields: ComputedRef<IProvisionFieldValue[]>;
  /** The provider functions this product exposes to the client. */
  functions: ComputedRef<IProvisionRequestAction[]>;
  /** The provider panels embedded in the overview. */
  iframes: ComputedRef<ProvisionIframe[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
};

/** Provisioning meta — one computed per state flag. */
export type UseContractProductProvisioningMeta = {
  /** True if the read or a function run failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True once the first read has completed, regardless of outcome. */
  isComplete: ComputedRef<boolean>;
  /** True if the product exposes no provisioning surface at all. */
  isEmpty: ComputedRef<boolean>;
  /** True while the read is loading or has not completed its first fetch. */
  isLoading: ComputedRef<boolean>;
  /** True while a function run is in flight. */
  isProcessing: ComputedRef<boolean>;
  /** True while the product has config fields to display. */
  hasFields: ComputedRef<boolean>;
  /** True while the product has runnable provider functions. */
  hasFunctions: ComputedRef<boolean>;
  /** True while the product has embedded provider panels. */
  hasIframes: ComputedRef<boolean>;
};

/** Provisioning actions — running a provider function, plus lifecycle. */
export type UseContractProductProvisioningActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the provisioning surface is ready. Always settles. */
  isReady: () => Promise<boolean>;
  /** Refetches the provisioning surface from the server. */
  refresh: () => Promise<void>;
  /** Runs one provider function, resolving what the consumer must do next. */
  run: (
    code: IProvisionRequestAction["designation"]
  ) => Promise<ProvisionFunctionResult>;
  /** Answers the setup blueprint and confirms it, taking the product live. */
  saveSetup: (model: ProvisioningSetupModel) => Promise<void>;
};

/** Provisioning internals (debugging) — exempt from conformance. */
export type UseContractProductProvisioningInternals = ContractInternals;

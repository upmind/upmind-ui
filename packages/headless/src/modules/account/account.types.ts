/** @internal */
// -----------------------------------------------------------------------------
/**
 * @module account/account.types
 * @description Account module type definitions. The post-auth standing arc —
 * unregistered (guest upgrade) → unverified (email verify + resend) → verified —
 * scoped by actor (client now, staff later).
 */

import { AccessRoleTypes } from "@upmind-automation/types";
import { ScopeActorTypes } from "../scope/scope.types";
import type { ResponseError } from "../../utils";
import type { IPhoneData } from "../client-phone";
import type { Client } from "../client";
import type { ScopeContext } from "../scope/scope.types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { ActorRef } from "xstate";
// -----------------------------------------------------------------------------
/**
 * Context types for account module.
 * Defines what entities a staff member can manage account standing on behalf of.
 */
export enum AccountContextTypes {
  /** Acting on behalf of a client. */
  CLIENT = AccessRoleTypes.CLIENT
}

/**
 * Account module scope matrix (runtime value - single source of truth).
 * Mirrors AUTH_SCOPE_MATRIX shape — actor-agnostic standing/verification.
 * - staff: can act on behalf of 'client'
 * - client: acts as self only
 * - guest: valid scope but not actionable (no account standing)
 */
export const ACCOUNT_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: AccountContextTypes.CLIENT,
  [ScopeActorTypes.CLIENT]: AccountContextTypes.CLIENT,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/**
 * Account module scope matrix type (derived from runtime const).
 */
export type AccountScopeMatrix = typeof ACCOUNT_SCOPE_MATRIX;

// Which guest-client form occupies the shared `unregistered` form node.
export enum ClientFormType {
  REGISTER = "register",
  EMAIL = "email"
}

export interface ClientContext {
  /** Resolved actor type (never SELF — resolved before machine starts). */
  scopeActor?: ScopeActorTypes;
  /** Scope context — who the actor is managing standing on behalf of. */
  scopeContext?: ScopeContext<`${AccountContextTypes}`>;
  /** Brand filter for multi-brand environments. */
  brandId?: string;
  // ---
  authHelper?: ActorRef<any>;
  /**
   * The active session's user, seeded at construction. Typed as the auth
   * `Client` view-model (a superset of `SessionUser`) because the machine reads
   * the guest flag and email-verification state — both produced by
   * `mapSessionUser` at runtime but absent from the `SessionUser` type.
   */
  client?: Client;
  error?: ResponseError;
  // --- form state. One shared form surface (register / email / verify); the
  // active form's schema/model live here and `formType` says which it is.
  customFields?: any[];
  formType?: ClientFormType;
  model?: CompleteRegistrationModel | GuestEmailModel | VerifyEmailModel;
  schema?: JsonSchema;
  uischema?: UISchemaElement;
}

export type CompleteRegistrationModel = {
  customFields?: Record<string, unknown>;
  email: string;
  firstname: string;
  lastname: string;
  password: string;
  phone?: IPhoneData;
};

export type GuestEmailModel = {
  email?: string;
};

export interface VerifyEmailModel {
  code?: string;
}

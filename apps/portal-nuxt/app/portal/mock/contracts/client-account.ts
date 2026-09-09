// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-account
 * @description Four-layer contract for the two writes that act on the ACCOUNT
 * the client is signed in as rather than on anything it owns (plan F5 O1, O6):
 * which of their accounts is in play, and the picture that account wears.
 *
 * ONE home for the account domain: this contract, `client-account.schemas.ts`
 * beside it, and `account.schemas.ts` — which is the STAND-IN for the real
 * `account` module's verify-email and guest-email parsers, the same real
 * module named here. The real module is a FORM machine (its context is
 * `schema` / `uischema` / `model`), so only its lifecycle door is reusable and
 * the rest is declared.
 *
 * CHANGE (plan §3): headless `useAccount` carries neither a tenancy switch nor
 * an avatar write. Legacy read `auth.client.accounts` straight off its store
 * and posted the picture through the profile card, so both are declared here
 * for the real module to grow.
 *
 * @oracle vue-app `origin/master` — `tenancy/selectAccountModal.vue` and
 * `selectAccountList.vue` (the accounts a sign-in may act for, the active one
 * marked), and the profile card's `@avatar-changed`.
 */

import { AccessRoleTypes } from "@upmind-automation/types";
import { NO_ACTOR_CONTEXT, SCOPE_ACTOR } from "./scope";
import type { ContractInternals } from "./scope";
import type {
  ActorContextMatrix,
  ResponseError,
  UseAccountActions
} from "@upmind-automation/headless";
import type { IAccount, IClient } from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * One account a sign-in may act for. The wire `IAccount` carries far more; a
 * switcher renders the id it posts, the name it reads by, and the brand that
 * tells two same-named accounts apart.
 */
export type ClientAccount = {
  readonly id: IAccount["id"];
  readonly name: string;
  readonly brandName: string;
};

/** What the switch-account form writes — the account to act for. */
export type SwitchAccountModel = {
  accountId: ClientAccount["id"];
};

/** What the avatar form writes — where the picture lives. */
export type AvatarModel = {
  avatarSrc: IClient["image_url"];
};

/** What the switcher's schema is handed — the accounts on offer, and the one in play. */
export type SwitchAccountContext = {
  readonly accounts: readonly ClientAccount[];
  readonly activeAccountId: ClientAccount["id"] | undefined;
};

/**
 * What the appearance form writes — legacy's `parentBrandAppearanceForm`
 * fields, narrowed to the three a mock can honestly take (the image fields
 * need uploads, which the plan takes none of).
 */
export type ParentBrandingModel = {
  name: string;
  /** A six-digit hex colour with its hash. */
  colour: string;
  font: string;
};

/** What the appearance form is handed — the appearance on file today. */
export type ParentBrandingContext = {
  readonly name: string;
  readonly colour: string;
  readonly font: string;
};

// -----------------------------------------------------------------------------
// SCOPE
// -----------------------------------------------------------------------------

/** Context types for the account writes — whose account is addressed. */
export const ClientAccountContextTypes = {
  /** Acting on the signed-in client's own account. */
  CLIENT: AccessRoleTypes.CLIENT
} as const;

export type ClientAccountContextTypes =
  (typeof ClientAccountContextTypes)[keyof typeof ClientAccountContextTypes];

/**
 * Scope matrix for `useClientAccount`. `client` is the only actor that
 * resolves; the portal mock has no staff or guest surface (plan §6).
 */
export const CLIENT_ACCOUNT_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientAccountContextTypes.CLIENT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientAccount`. */
export type ClientAccountScopeMatrix = typeof CLIENT_ACCOUNT_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// LAYERS — useClientAccount
// -----------------------------------------------------------------------------

/**
 * Account context — who the client is acting as, and what they may act as.
 *
 * CHANGE: none of the real `UseAccountContext` is reusable. Its five members
 * are the active FORM's state (`schema`, `uischema`, `model`, `errors`,
 * `validationErrors`), which answer a different question from this one.
 */
export type UseClientAccountContext = {
  /** The accounts this sign-in may act for; one (or none) offers no switch. */
  accounts: ComputedRef<ClientAccount[]>;
  /** The one being acted for — `undefined` where the sign-in holds none. */
  activeAccount: ComputedRef<ClientAccount | undefined>;
  /** The picture the account wears — `IClient.image_url`. */
  avatarSrc: ComputedRef<IClient["image_url"]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
};

/**
 * Account meta — one computed per state flag.
 *
 * CHANGE: the real `UseAccountMeta` is the form machine's own (`canResend`,
 * `isCompletingRegistration`, `showGuestEmailForm`), so none of it carries
 * over; these are the four every scoped read publishes, plus the one gate the
 * switcher is offered behind.
 */
export type UseClientAccountMeta = {
  /** True if a read or a write failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if the sign-in holds no account at all. */
  isEmpty: ComputedRef<boolean>;
  /** True while a read or a write is in flight. */
  isLoading: ComputedRef<boolean>;
  /** True while there is a second account to switch to — the control's own gate. */
  hasAccountChoice: ComputedRef<boolean>;
};

/**
 * Account actions — the two writes, plus lifecycle. `destroy` is the REAL
 * module's own member (`Pick<UseAccountActions, "destroy">`), so a rename
 * upstream fails here; the other three lifecycle doors are the scoped
 * pattern's, which the real form machine does not publish.
 */
export type UseClientAccountActions = Pick<UseAccountActions, "destroy"> & {
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the account can be read. Always settles. */
  isReady: () => Promise<boolean>;
  /** Refetches the account from the server. */
  refresh: () => Promise<void>;
  /** Puts one of the sign-in's accounts in play — legacy's tenancy switcher. */
  switchAccount: (model: SwitchAccountModel) => Promise<boolean>;
  /** Points the account's picture somewhere else. */
  saveAvatar: (model: AvatarModel) => Promise<boolean>;
  /**
   * Saves the appearance this account lends to the ones it manages — legacy's
   * `parentBrandAppearanceForm`, whose save posted the brand name, colour and
   * font together.
   */
  saveParentBranding: (model: ParentBrandingModel) => Promise<boolean>;
};

/** Account internals (debugging) — exempt from conformance. */
export type UseClientAccountInternals = ContractInternals;

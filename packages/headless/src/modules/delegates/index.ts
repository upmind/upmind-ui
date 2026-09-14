// -----------------------------------------------------------------------------
/**
 * @module delegates
 * @description Public exports for delegate access — an owner sharing its
 * account, and an invitee accepting. Curated named re-exports only, no
 * `export *` (Module Visibility Law).
 *
 * STUB (FE-3036). This module is currently the three client-portal calls the
 * delegated-access fixtures are recorded through: invite, list, accept. It has
 * no scoped composable yet on purpose — FE-3041 (DG-2) owns the module proper,
 * and scaffolding an actor arm here before that story designs it would pre-empt
 * the scope-collapse decision it exists to make.
 */

// --- Imperative one-shot calls
export {
  acceptDelegateInvite,
  inviteClientDelegate,
  readClientDelegates
} from "./delegates.services";

// --- Public model types
export type {
  AcceptedDelegateInvite,
  Delegate,
  DelegateInviteModel
} from "./delegates.types";

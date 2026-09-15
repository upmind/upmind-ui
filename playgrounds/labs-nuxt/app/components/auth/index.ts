// -----------------------------------------------------------------------------
/**
 * @module components/auth
 * @description The one auth surface of this playground. The `useAuth` page and
 * the auth overlay render THIS — never a second wiring of the journey
 * (`R6-15b`).
 */

export { default as AuthGuestCustomer } from "./AuthGuestCustomer.vue";
export { default as AuthJourney } from "./AuthJourney.vue";
export { AUTH_GATE_GUEST_CUSTOMER } from "./AuthJourney.types";
export type * from "./AuthJourney.types";

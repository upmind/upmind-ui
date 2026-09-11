// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts
 * @description The contract barrel — one module per future headless module
 * (plan R2): its four-layer types, filter map, sortable properties and
 * ADR-001 scope matrix. A facade imports its types from here and `satisfies`
 * them; `/scoped-composable-factory` consumes the same files unchanged.
 */

// The one *.schemas file the barrel carries: the account module's own
// verification parsers, whose exports are named for their module (no bare
// `defaults`) and so cannot collide with a contract's.
export * from "./account.schemas";
export * from "./client-account";
export * from "./client-affiliate";
export * from "./client-billing-settings";
export * from "./client-child-accounts";
export * from "./client-contract-product";
export * from "./client-contract-products";
export * from "./client-credit-notes";
export * from "./client-custom-pages";
export * from "./client-delegates";
export * from "./client-invoices";
export * from "./client-ip-whitelist";
export * from "./client-login-attempts";
export * from "./client-orders";
export * from "./client-payment-details";
export * from "./client-security";
export * from "./client-support-pin";
export * from "./client-tickets";
export * from "./client-vault";
export * from "./client-wallet";
export * from "./contract-product-provisioning";
export * from "./scope";
export * from "./user-notifications";

/**
 * Gateway provider codes (`GatewayProviderCodes`) — the stable, locale- AND
 * order-independent identity each gateway radio is tagged with via
 * `data-testid="gateway-{provider}"` in `GatewaysRenderer.vue`. Use with
 * `Checkout.selectGatewayByType`. `PAY_LATER` is the synthetic `PaymentType`
 * slug the renderer appends, not a real provider.
 */
export const gateways = {
  STRIPE: "Stripe_PaymentIntents",
  PAYPAL_EXPRESS: "PayPal_Express",
  BANK_TRANSFER: "BankTransfer",
  OFFLINE: "Offline",
  PAY_LATER: "pay-later"
} as const;

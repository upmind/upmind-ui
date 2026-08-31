# Business-logic source of truth for the invoices module.
# Non-executable. Declarative. Capability altitude.
# The module's unit + integration tests trace back to each @INV-* anchor.
#
# Scope: this module LOADS one invoice, MAPS it to the customer-facing shape,
# and DERIVES a settlement view from it. Charging the card, offsite-redirect
# reading, and the payment machine live in the payment / paymentDetails
# siblings — not here — so no scenario below describes them.

Feature: Invoices — load and read a single billing document

  An invoice is the frozen billing document a basket becomes at conversion.
  This module reads one invoice for an authenticated client, maps it to the
  customer-facing shape, and derives whether it is paid, free, part-paid, or
  awaiting a first payment. It exposes readiness, refresh, and cache-drop.

  # --- Read access (integration: crosses the HTTP + auth-guard seam) --------

  @INV-read @client
  Scenario: A client reads their own invoice
    Given a client is authenticated
    And the client owns an invoice
    When the client loads that invoice
    Then the client receives the invoice with its client snapshot, line items, payments, and financial summary

  @INV-guest-denied @guest
  Scenario: An unauthenticated caller is denied the invoice
    Given no client is authenticated
    When a caller tries to load an invoice
    Then the load is not attempted and the invoice is reported unavailable

  @INV-refresh @client
  Scenario: A refresh re-reads the invoice from the platform
    Given a client has loaded an invoice
    When the client refreshes the invoice
    Then the invoice is re-read from the platform

  @INV-invalidate @client
  Scenario: Invalidate drops the cached invoice
    Given a client has a cached invoice
    When the client invalidates the invoice
    Then the cached invoice is dropped so the next read re-fetches it

  @INV-ready @client
  Scenario: Readiness resolves once the session and the invoice fetch settle
    Given a client is authenticating while an invoice fetch is in flight
    When the session settles and the fetch completes
    Then the readiness signal resolves for the caller

  # --- Mapping (unit: pure transform of the raw record) --------------------

  @INV-map-shape @client
  Scenario: The raw record is mapped to the customer-facing invoice shape
    Given a raw invoice record from the platform
    When the record is mapped
    Then the result carries the id, number, status, currency, line items, payments, and money summary

  @INV-map-frozen @client
  Scenario: The mapped client snapshot is the one frozen at conversion
    Given a raw invoice whose embedded client differs from the live client
    When the record is mapped
    Then the mapped invoice shows the client details embedded on the record

  @INV-map-optional-address @client
  Scenario: An invoice with no address maps without one
    Given a raw invoice that carries no billing address
    When the record is mapped
    Then the mapped invoice has no address rather than an empty one

  @INV-map-payments-order @client
  Scenario: Mapped payments are ordered newest first
    Given a raw invoice with several recorded payments
    When the record is mapped
    Then the mapped payments are ordered from newest to oldest

  @INV-map-payment-success @client
  Scenario: A captured, non-pending payment maps as successful
    Given a raw invoice with a captured payment that is not pending
    When the record is mapped
    Then that payment is marked successful and not pending

  @INV-map-payment-pending @client
  Scenario: A pending payment maps as pending and not successful
    Given a raw invoice with a payment still pending capture
    When the record is mapped
    Then that payment is marked pending and not successful

  @INV-map-payment-cardless @client
  Scenario: A payment with no saved card maps without card details
    Given a raw invoice payment funded without a saved card
    When the record is mapped
    Then that payment carries no card type and no card last-four

  # --- Settlement derivation (unit: pure derivation off the loaded record) --

  @INV-state-paid @client
  Scenario: An invoice with payments and nothing owed derives a paid state
    Given a loaded invoice with recorded payments and zero unpaid amount
    When the client reads the settlement view
    Then the settlement view reports the invoice as paid

  @INV-state-free @client
  Scenario: An invoice with no payments and nothing owed derives a free state
    Given a loaded invoice with no payments and zero unpaid amount
    When the client reads the settlement view
    Then the settlement view reports the invoice as free

  @INV-state-partial @client
  Scenario: An invoice with a paid part and a remaining balance derives a partial state
    Given a loaded invoice with a positive paid amount and a positive unpaid amount
    When the client reads the settlement view
    Then the settlement view reports the invoice as partially paid

  @INV-state-pending @client
  Scenario: An unpaid invoice with no payments yet derives a pending state
    Given a loaded invoice with no payments and a positive unpaid amount
    When the client reads the settlement view
    Then the settlement view reports the invoice as pending its first payment

  @INV-state-error @client
  Scenario: A failed load surfaces as an error state
    Given an invoice load that failed
    When the client reads the settlement view
    Then the settlement view reports the error and no invoice data

  @INV-state-availability @guest
  Scenario: An unauthenticated session reports the invoice as unavailable
    Given no client is authenticated
    When the caller reads the settlement view
    Then the settlement view reports the invoice as unavailable

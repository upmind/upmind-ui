@client-orders @FE-3237
Feature: Client order history — the client self-service capability
  As a client
  I want to browse, filter, sort, search, pay and cancel my own orders
  So that I can find and act on an order without a legacy portal

  # Business-logic anchor (code-test-bdd). Non-executable — this feature is
  # the source of truth the module's unit + integration tests trace to via
  # client-orders.traceability.test.ts. Layer routing: bdd.md's AC → Scenario
  # Mapping table (integration unless noted). Client x self only — every
  # other actor×context cell is refused at compile time (AC23).

  @AC-1 @FE-3237
  Scenario: A signed-in client reads their own order history
    Given a signed-in client with placed orders
    When the client opens the order history
    Then the history shows the client's own orders, forced to the order category
    And the request carries no client identifier

  @AC-2 @FE-3237
  Scenario: The history reads the legacy relations, and settles with an error when the brand fails
    Given a signed-in client opens the order history
    When the collection reads a page
    Then it requests the legacy relation set and the item count
    And it requests the brand relation only for a multi-brand organisation
    And a failed brand settle leaves the history settled with an error

  @AC-3 @FE-3237
  Scenario: A client pages through the history
    Given a signed-in client with more than one page of orders
    When the client moves between pages, and changes the page size
    Then the history publishes ten rows and the total from one request
    And a page-size change returns to the first page
    And a page or a page size under one becomes one
    And a client with no orders sees an empty history

  @AC-4 @FE-3237
  Scenario: An emptied page returns to the first page
    Given a client is on a page whose orders have gone away
    When the history reads that page again with no error and no total
    Then the history returns to the first page
    But a failed read leaves the client on their current page

  @AC-5 @FE-3237
  Scenario: The history reports store availability
    Given a signed-in client reads the order history
    When the collection publishes its availability
    Then it publishes the availability condition, the store visibility condition and the storefront address
    And the two brand values follow the legacy brand rules

  @AC-6 @FE-3237
  Scenario: Each row carries the legacy fields
    Given a signed-in client reads the order history
    When a row publishes
    Then the row carries every field the legacy row reads
    And a delegated order's row carries its delegated marker

  @AC-7 @FE-3237
  Scenario: A client narrows the history by any of the eight columns
    Given a signed-in client reads the order history
    When the client sets a filter on one of the eight client columns
    Then each column accepts its own legacy comparison set on the wire
    And the filter write returns to the first page
    And a second filter on the same text column replaces the first

  @AC-8 @FE-3237
  Scenario: A client narrows the history by date
    Given a signed-in client reads the order history
    When the client sets a date filter
    Then the history accepts an absolute moment and a relative period
    And the relative period can point to the past or to the future

  @AC-9 @FE-3237
  Scenario: A client narrows the history by status
    Given a signed-in client reads the order history
    When the client narrows to the Unpaid status choice
    Then the request asks for the unpaid and the adjusted statuses together
    And an equal and a not-equal status filter never apply together, from any writer

  @AC-10 @FE-3237
  Scenario: The history sorts newest first by default, and accepts each legacy field
    Given a signed-in client reads the order history with no sort chosen
    When the collection resolves the order
    Then the newest order comes first
    And the client can sort by each of the four legacy fields
    And a sort change keeps the current page

  @AC-11 @FE-3237
  Scenario: A client searches while a filter stays active
    Given a status filter is active on the order history
    When the client searches for an order number
    Then the status filter and the search apply together
    And the search matches the exact order number after a pause
    And a search returns to the first page

  @AC-12 @FE-3237
  Scenario: The forced order category survives every write
    Given a signed-in client reads the order history
    When any writer changes the criteria, the playground filter bar included
    Then the request still carries the forced order category

  # @todo — useClientOrder (the manager), client-orders.mappers.ts,
  # client-orders.ports.ts and client-orders.errors.ts do not exist in this
  # build pass (confirmed: absent from the module directory; index.ts's own
  # doc comment discloses "the single-record manager ... are NOT part of
  # this pass"; client-orders.surface.test.ts's own scope note says the
  # same). AC-13 through AC-16 are manager-owned (design.md 5.1 block
  # table). Not fabricatable by the prover seat — escalated for the next
  # build pass, not silently dropped.
  @AC-13 @FE-3237 @todo
  Scenario: A client opens one order
    Given a row in the order history
    When the client opens that order
    Then the manager reads that order with the staged-import flag and the legacy relation set
    And an identifier that does not resolve publishes no record and an error
    And the reload control sends the read again

  # @todo — same reason as AC-13: manager-owned, useClientOrder not built
  # this pass.
  @AC-14 @FE-3237 @todo
  Scenario: The order detail carries the legacy fields
    Given a client opens one order
    When the manager publishes the order
    Then it publishes every detail field the legacy detail reads for a client

  # @todo — same reason as AC-13: manager-owned (item projection lives in
  # client-orders.mappers.ts, not built this pass).
  @AC-15 @FE-3237 @todo
  Scenario: The order items read the snapshot first
    Given a client opens one order
    When the manager publishes the order's items
    Then it reads the snapshot first and the live items only when the snapshot is absent
    And each item carries its legacy fields, its billing term, its billing-cycle name, its tags, its contract links and its sub-items

  # @todo — same reason as AC-13: manager-owned.
  @AC-16 @FE-3237 @todo
  Scenario: The order items load their catalogue images without blocking the order
    Given a client opens one order with items
    When the manager publishes the order's items
    Then it reads the catalogue images in a second, non-blocking request
    And an item with no catalogue image falls back to its product image

  @AC-17 @FE-3237
  Scenario: The brand publishes the one-time-purchases condition
    Given a brand configuration
    When the order history reads the brand's one-time-purchases setting
    Then it gates the item link on that condition

  @AC-18 @FE-3237
  Scenario: The order publishes its legacy status conditions
    Given a client opens one order
    When the manager publishes the order
    Then it publishes the paid, part-paid, due, overdue, payable, cancellable and cancelled conditions by the legacy status rules
    And it publishes the pay gate and the cancel gate

  # @todo — same reason as AC-13: manager-owned.
  @AC-19 @FE-3237 @todo
  Scenario: The order publishes its status-message inputs
    Given a client opens one order
    When the manager publishes the order
    Then it publishes the delegated marker, the pending-payment condition and the online-gateway condition of the order's brand

  # @todo — manager-owned; the pay delegate (usePayment(), design 8.2)
  # is not built this pass.
  @AC-20 @FE-3237 @todo
  Scenario: A client pays a payable order through the existing engine
    Given a client opens a payable order
    When the client pays it
    Then the existing payment engine takes the order as its invoice
    And a completed payment marks the order and the history stale

  # @todo — manager-owned; client-orders.ports.ts (the cancellation port,
  # design 8.2/D-21) and client-orders.errors.ts
  # (OrderCancellationUnavailableError) are not built this pass.
  @AC-21 @FE-3237 @todo
  Scenario: A client cancels a cancellable order through the cancellation port
    Given a client opens a cancellable order
    When the client cancels it
    Then the cancellation port receives the order's contract
    And a completed cancellation marks the history stale
    But a refused cancel gate sends nothing
    And cancelling with no connected flow fails with a named error and sends nothing

  @AC-22 @FE-3237
  Scenario: A hand can drive both composables in the playground
    Given the operator opens the playground
    When a hand drives the collection and the manager
    Then every published member is reachable on the page
    And each enter of the order view reads the order again

  @AC-23 @FE-3237
  Scenario: The module serves the client self cell only
    Given the module is in use
    When any actor other than a signed-in client acting on themselves is tried
    Then the retarget is refused at compile time
    And a signed-out caller triggers no request

  # @todo — design 8.9 requires each divergence recorded under its own
  # heading in the module's docs/gotchas.md; this module has no docs/
  # directory at all this pass (confirmed: absent from the module
  # directory), so "the difference is recorded in the module's own
  # documentation" cannot hold yet regardless of what a spec could prove.
  # Divergence #4 (pay surface) is also manager-owned (AC-20/21's @todo
  # reason applies). Divergences #1-3 are collection-level and could be
  # spec-proven once docs/gotchas.md exists — tracked as open follow-up
  # work, not fabricated here.
  @AC-24 @FE-3237 @todo
  Scenario: Every divergence from the legacy application is recorded and proven
    Given the module differs from the legacy application on a known behaviour
    When that behaviour is exercised
    Then the difference is recorded in the module's own documentation
    And a spec proves each recorded difference

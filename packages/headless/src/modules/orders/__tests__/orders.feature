@orders @FE-3237
Feature: Order history — the client self-service capability
  As a client
  I want to browse, filter, sort, search, pay and cancel my own orders
  So that I can find and act on an order without a legacy portal

  # Business-logic anchor (code-test-bdd). Executable under ADR-020
  # Amendment 5: the module's own orders.replay.int.test.ts drives the six
  # collection scenarios that design 8.12 names, over the recorded corpus.
  # Their Then steps read the query model, the pagination, the data and the
  # meta only. Every scenario traces to a spec through
  # orders.traceability.test.ts. Layer routing: the bdd.md AC to Scenario
  # mapping. Client x self only.

  @AC-1 @FE-3237 @client
  Scenario: A signed-in client reads the history
    Given a signed-in client with placed orders opens the order history
    When the order history settles its first page
    Then the order history publishes the client's own orders
    And the order history criteria hold the forced order category

  @AC-1 @FE-3237 @client
  Scenario: The client refreshes the order history from the platform
    Given a signed-in client has loaded their order history
    When the client drops the order history cache through its own controls
    Then an invalidated order history asks the platform for the list again
    And a reset order history clears a forced list and asks the platform again
    And a destroyed order history leaves the scope registry with no stale reader

  @AC-2 @FE-3237 @client
  Scenario: The list asks for the legacy relations
    Given a signed-in client of a single-brand or a multi-brand organisation
    When the collection reads a page of orders
    Then it asks for the legacy relation set and the item count
    And it asks for the brand of each order only for a multi-brand organisation
    And a brand that fails to settle leaves the collection settled with an error

  @AC-3 @FE-3237 @client
  Scenario: A client moves between pages
    Given a signed-in client with more than one page of orders in the order history
    When the client moves to page two of the order history and back to page one
    Then the order history pagination shows each page of ten orders and the total

  @AC-3 @FE-3237 @client
  Scenario: A page or a page size out of range becomes valid
    Given a signed-in client with more than one page of placed orders
    When the client asks for a page or a page size under one
    Then the collection keeps a page and a page size of at least one
    And a page-size change returns the collection to its first page

  @AC-3 @FE-3237 @client
  Scenario: A client with no orders sees an empty history
    Given a signed-in client who has never placed an order
    When the collection settles its first page
    Then the collection reports itself empty with a zero total and no error

  @AC-4 @FE-3237 @client
  Scenario: An emptied page returns to the first page
    Given a client is on a page whose orders have gone away
    When the collection reads that page again with no error and a zero total
    Then the collection returns to its first page
    But a failed read keeps the client on the current page

  @AC-24 @FE-3237 @client
  Scenario: An emptied page with orders remaining moves to the last page, not the first
    Given a client asks for a page past the last page of their placed orders
    And earlier pages still hold orders
    When the collection settles that read
    Then the collection lands on the last page it can show
    And the collection never lands back on the first page for this recovery

  @AC-5 @FE-3237 @client
  Scenario: The history reports availability and the store control
    Given a signed-in client of a brand with a store display mode
    When the collection publishes its availability
    Then it publishes the availability, the store visibility and the storefront address
    And the store visibility follows the store display mode, not the catalogue state

  @AC-6 @FE-3237 @client
  Scenario: Each row carries the legacy row fields
    Given a signed-in client with placed orders
    When a row of the collection publishes
    Then the row carries every field the legacy row reads
    And a delegated order's row carries its delegated marker

  @AC-7 @FE-3237 @client
  Scenario: Each client column and comparison sets the history criteria
    Given a signed-in client on page two of the order history
    When the client sets each order history filter below
      | column                         | comparisons                    |
      | number                         | like, eq, neq                  |
      | total_amount                   | eq, neq, gt, gte, lt, lte      |
      | status.code                    | eq, neq                        |
      | created_at                     | gt, gte, lt, lte, after, before |
      | paid_datetime                  | gt, gte, lt, lte, after, before |
      | products.product.name          | like, eq, neq                  |
      | products.product.category.name | like, eq, neq                  |
      | products.service_identifier    | like, eq, neq                  |
    Then the order history criteria hold each filter under its own comparison
    And the order history returns to page one
    And a second filter on the same text column of the order history replaces the first

  @AC-7 @FE-3237 @client
  Scenario: The history tells a client filter from the forced order category
    Given a signed-in client reads the order history with no filter chosen
    When the client searches the order history and then clears the search
    Then the order history reads as filtered only while the search applies
    And a criteria write on one branch leaves the order and the forced order category as they stand
    And a filters write clears each order history filter that it leaves out

  @AC-8 @FE-3237 @client
  Scenario: A date filter takes both value forms
    Given a signed-in client with placed orders
    When the client narrows the placed orders by date
    Then the collection accepts an absolute moment and a relative period
    And the relative period can point to the past or to the future

  @AC-9 @FE-3237 @client
  Scenario: The Unpaid choice asks for two statuses
    Given a signed-in client with placed orders
    When the client narrows the placed orders to the Unpaid status choice
    Then the collection asks for the unpaid and the adjusted statuses together
    And an equal and a not-equal status filter never apply together, from any writer

  @AC-10 @FE-3237 @client
  Scenario: The newest order comes first, and a sort keeps the page
    Given a signed-in client on page two of the order history
    And with no sort chosen the order history criteria put the newest order first
    When the client sorts the order history by each legacy field
    Then the order history criteria hold the chosen field
    And the order history stays on page two

  @AC-11 @FE-3237 @client
  Scenario: Search and filters live together
    Given a status filter is active on page two of the order history
    When the client searches the order history for an order number
    Then the order history criteria hold the status filter and the exact order number together
    And the order history returns to page one

  @AC-12 @FE-3237 @client
  Scenario: The forced category survives each writer
    Given a signed-in client reads the order history
    When each order history writer changes the criteria, the playground filter bar included
    Then the order history criteria still hold the forced order category

  @AC-13 @FE-3237 @client
  Scenario: A client opens one order
    Given a row of the placed orders
    When the client opens that order
    Then the manager reads that order with the staged-import flag and the legacy relation set
    And an identifier that does not resolve publishes no record and an error
    And the reload control sends the read again

  @AC-13 @FE-3237 @client
  Scenario: The client refreshes one order from the platform
    Given a client has opened one placed order
    When the client drops the order cache through the manager's own controls
    Then an invalidated order asks the platform for that order again
    And a reset order clears a forced order and asks the platform again
    And a destroyed order manager leaves the scope registry, and a fresh manager reads the order again

  @AC-14 @FE-3237 @client
  Scenario: The detail carries the legacy fields
    Given a client opens one placed order
    When the manager publishes the order
    Then it publishes every detail field the legacy detail reads for a client, the referrer included
    And a cancelled order never shows the invoice reason as its cancellation reason

  # @todo — staging holds no cancelled order whose contract carries a
  # cancellation reason: the recorder read all 32 cancelled orders with no
  # payment and found none. Design 8.8 declares no construction for it, so
  # the prover stops and tells the operator (FE-3237 prover hand-off).
  @AC-14 @FE-3237 @client @todo
  Scenario: A cancelled order shows the contract's cancellation reason
    Given a client opens a cancelled order whose contract carries a reason
    When the manager publishes the order
    Then the detail shows the contract's reason as the cancellation reason

  @AC-15 @FE-3237 @client
  Scenario: Items come from the order's snapshot
    Given a client opens one placed order
    When the manager publishes the order's items
    Then it publishes one item for each line of the order's snapshot
    And each item carries its legacy fields, its billing term, its billing-cycle name and its contract links

  # @todo — the single read of design 8.1 returns no live items, so the
  # snapshot precedence, the live fallback and the empty-snapshot rule give
  # the same items with or without the rule on every recorded read. The
  # declared "snapshot term rows" construction keeps the product term, so no
  # item has a zero billing term and the hidden link rule cannot turn a link
  # off. Design 8.8 declares no construction for either state, so the prover
  # stops and tells the operator (FE-3237 prover hand-off).
  @AC-15 @FE-3237 @client @todo
  Scenario: The live items and the one-time link rule
    Given a client opens one placed order with no snapshot, or with an item that has no billing term
    When the manager publishes the order's items
    Then the snapshot wins over the live items, and an order with no snapshot lists its live items
    And an empty snapshot gives no items and no live fallback
    And an item with no billing term has no link when the brand hides one-time purchases

  # @todo — staging holds no snapshot item with options or attributes and no
  # order with contract product tags (the T16a disclosure log). Design 8.8
  # says: stop and tell the operator. Escalated in the FE-3237 prover hand-off.
  @AC-15 @FE-3237 @client @todo
  Scenario: Each item groups its tags and its sub-items
    Given a client opens one placed order whose items carry tags, options and attributes
    When the manager publishes the order's items
    Then each item carries its tags and splits its sub-items by the legacy order type

  @AC-16 @FE-3237 @client
  Scenario: Item images come from the catalogue
    Given a client opens one placed order with items
    When the manager publishes the order's items
    Then it reads the catalogue images in a second, non-blocking request
    And an item with no catalogue image keeps its product image

  @AC-17 @FE-3237 @client
  Scenario: One-time purchases stay linkable until the brand portal setting lands
    Given a client opens an order while the brand portal one-time-purchases setting is not yet exposed
    When the order history reads the one-time-purchases gate
    Then the gate reports one-time purchases as not hidden, so a one-time item keeps its link

  @AC-18 @FE-3237 @client
  Scenario: The legacy status rules give each condition
    Given a client opens one placed order
    When the manager publishes the order
    Then it publishes the paid, part-paid, due, overdue, payable, cancellable and cancelled conditions by the legacy status rules
    And it publishes the pay gate and the cancel gate

  @AC-19 @FE-3237 @client
  Scenario: The status-message inputs
    Given a client opens one placed order
    When the manager publishes the order
    Then it publishes the delegated marker, the pending-payment condition and the online-gateway condition of the order's brand

  # @todo — the design 8.8 engine-run captures need one real wallet payment on
  # shared staging (T21a). That side effect waits for the operator go-ahead.
  @AC-20 @FE-3237 @client @todo
  Scenario: Pay goes through the existing engine
    Given a client opens a payable order
    When the client pays it
    Then the existing payment engine takes the order as its invoice
    And a completed payment marks the order and the history stale

  @AC-21 @FE-3237 @client
  Scenario: Cancel gives the contract to the port
    Given a client opens a cancellable order
    When the client cancels it
    Then the cancellation port receives the order's contract
    And a completed cancellation marks the order and the history stale
    But a refused cancel gate sends nothing
    And cancelling with no connected flow fails with a named error and sends nothing

  # @todo — labs e2e lane dropped from this MR (operator ruling 2026-10-05):
  # the playground consumer proof that drove the two composables shipped on the
  # labs-nuxt orders e2e lane, which this MR does not add. The headless
  # dotted-operators int tests still prove the status-filter wire at the data
  # layer; the hand-driven consumer journey is an unproven, named gap until the
  # lane lands.
  @AC-22 @FE-3237 @client @todo
  Scenario: A hand drives the two composables
    Given the operator opens the playground
    When a hand drives the collection and the record
    Then the opened order draws whole on the shared record surface
    And paying a payable order opens the shared payment overlay

  @AC-23 @FE-3237 @client
  Scenario: The cell stays the client self cell
    Given the module is in use
    When any actor other than a signed-in client acting on themselves is tried
    Then the retarget is refused at compile time
    And a signed-out caller triggers no request

  # @todo — the record half: docs/gotchas.md with the four
  # "## Accepted divergence N" headings of design 8.9 is developer-seat work
  # (tasks.md T28). The proof half is orders.divergences.
  @AC-24 @FE-3237 @client @todo
  Scenario: The divergences are recorded and true
    Given the module differs from the legacy application on a known behaviour
    When that behaviour is exercised
    Then the difference is recorded in the module's own documentation
    And a spec proves each recorded difference

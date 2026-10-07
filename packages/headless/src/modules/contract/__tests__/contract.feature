# contract — the module's behavioural source of truth (capability altitude).
#
# The co-located business-logic feature for `useContracts` (the contracts
# collection) and `useContract` (the per-contract manager, addressed by id).
# Every scenario is DRIVEN by `contract.replay.int.test.ts` through
# `contract.steps.ts`, each against its own recording under
# `scenarios/<slug>/<NN>/` (FE-3145, ADR 035 + Amendment 1). A request no step
# recorded fails its scenario by name, so "no request is sent" is proven by the
# recording holding none.
#
# SCOPE — one ADR-001 cell: client x self. Staff and guest are `never` in both
# scope matrices. A staff account only ARRANGES staging state in the generator.
#
# LEGACY IS THE ORACLE (operator ruling, FE-3145). A client may change the
# payment method only on their own subscription that is not delegated to them
# (vue-app `cProdProvider.vue:337` `canModifySettings`); legacy has no fraud
# gate on that change. Legacy has no client contracts list; the collection
# scenarios prove `useContracts` itself (operator ruling).

@module:contract @variant:hybrid @cell:client-self
Feature: A client manages their own contracts

  A client's contract is the agreement one or more of their products sit
  under. Two surfaces serve them: a COLLECTION the client browses, narrows,
  orders and pages, and a per-contract MANAGER through which the client reads
  one contract in full and points it at a different stored payment method.
  Both act on that client's own account and never another account's.

  # === WITHOUT A SIGNED-IN CLIENT (signed-out, no Background) ================

  @AC-16 @module @guard @signed-out @negative-control @collection
  Scenario: My contracts list is not read without an authenticated client session
    Given my client session has ended and I am signed out of my contracts
    When I ask for my contracts
    Then my contracts report themselves unavailable to me
    And no request is made for my contracts

  @AC-16 @module @guard @signed-out @negative-control @manager
  Scenario Outline: One of my contracts is not read or changed without an authenticated client session
    Given my client session has ended and I am signed out of my contracts
    When <use>
    Then the contract reports itself unavailable to me
    And no request is made for that contract

    Examples:
      | use                                              |
      | I open one of my contracts while signed out      |
      | I force a change to my contract's payment method |

  Rule: A signed-in client manages their own contracts

    Background:
      Given I am an authenticated client acting on my own contracts

  # === THE CONTRACTS COLLECTION ===============================================

  @AC-14 @collection
  Scenario: See the first page of my contracts
    When I open my contracts
    Then I see the first page of my contracts, oldest first
    And I am told which page I am on and how many contracts I have
    And my list asks for one page of contracts, assuming no page position of its own
    And each contract shows when it next bills, its billing cycle, when I bought it and its price, as it was read

  @AC-14 @collection
  Scenario: Move forward to the next page of my contracts
    Given I have opened my contracts, and they run to more than one page
    When I move forward to the next page
    Then the next page of my contracts comes back

  @AC-14 @collection
  Scenario: Move back to the previous page of my contracts
    Given I have opened my contracts, and they run to more than one page
    And I have moved on to the second page of them
    When I move back to the previous page
    Then the first page of my contracts comes back

  @AC-14 @collection
  Scenario: Jump to the last page of my contracts
    Given I have opened my contracts, and they run to more than one page
    When I move forward to the last page
    Then the last page of my contracts comes back, and I am told there is no further page to go to

  @AC-14 @collection
  Scenario: Choose how many of my contracts come on one page
    Given I have opened my contracts, and they run to more than one page
    When I choose how many of my contracts come on one page
    Then my contracts come that many at a time

  @AC-14 @collection
  Scenario: Narrow my contracts to the ones in one state
    Given I have opened my contracts, and they run to more than one page
    When I narrow my contracts to the active ones
    Then only my active contracts come back
    And I am told my list is narrowed

  @AC-14 @collection
  Scenario: Clear my narrowing to see my whole list again
    Given I have narrowed my contracts to the active ones
    When I clear the narrowing
    Then I am no longer told my list is narrowed
    And my whole list of contracts comes back

  @AC-14 @collection
  Scenario: Order my contracts by when they next bill, latest first
    Given I have opened my contracts, and they run to more than one page
    When I order my contracts by when they next bill, latest first
    Then my contracts come back in that order

  @AC-14 @collection
  Scenario: An order I empty falls back to oldest first
    Given I have ordered my contracts by when they next bill, latest first
    When I empty the order
    Then my contracts come back oldest first again

  @AC-14 @collection
  Scenario: Read my contracts again to see how they stand now
    Given I have narrowed my contracts to the suspended ones, newest first
    When I read my contracts again after one more of them is suspended
    Then my list shows the contract that was suspended since I last read it

  # === ONE CONTRACT, READ IN FULL ============================================

  @AC-3 @AC-12 @manager
  Scenario: Open one of my contracts with everything the account area needs
    Given one of my contracts has a cancellation request on it
    When I open that contract
    Then it names the very contract I opened, titled by the order it was bought under
    And it arrives with the cancellation request on it
    And it arrives with the contract's own status and my account's image
    And it lists each of its products by name and id, with its status, its tags, its catalogue image and its brand's currency
    And my stored payment methods are loaded ready for the payment-method form
    And its lifecycle state is named in the platform's own contract vocabulary
    And the state of the cancellation request on it is named in the platform's own cancellation vocabulary

  @AC-3 @manager @negative-control
  Scenario: When reading a contract fails I am shown why, instead of the contract I had open
    Given I have one of my contracts open in the manager
    When I open the manager on a contract that is not one of mine
    Then I am shown the reason the failed read returned
    And the manager has stopped loading, reports an error and tells me at once the contract is not ready
    And it does not hold the contract I had open

  @AC-3 @manager
  Scenario: Reset my contract to read it again as it now stands
    Given I have one of my contracts open in the manager
    When I reset my contract after it has been suspended
    Then my contract is shown to me as suspended, with no error

  # === CHANGING HOW A CONTRACT IS PAID FOR ===================================

  @AC-8 @AC-16 @manager @mutation @negative-control
  Scenario Outline: Point my <standing> subscription at a different stored payment method
    Given I have my <standing> subscription open in the manager, paying by one of my stored methods
    And I have opened the payment-method form
    When I choose a different stored card and submit the payment-method form
    Then the change is saved and the form closes with no error
    And that contract now bills against the method I chose, and the change reached only my own contract

    Examples:
      | standing  |
      | active    |
      | suspended |
      | cancelled |
      | lapsed    |

  @AC-8 @manager @mutation
  Scenario: Choose a stored payment method for a contract that has none
    Given I have a subscription of mine open in the manager that pays by no stored method
    And I have opened the payment-method form, which starts with no method chosen
    When I choose a different stored card and submit the payment-method form
    Then the change is saved and the form closes with no error
    And that contract now bills against the method I chose

  @AC-8 @manager @mutation @negative-control
  Scenario: I am not offered a payment-method change on a one-off purchase
    Given I have my one-off purchase open in the manager, paying by one of my stored methods
    When I try to change how it is paid for
    Then the payment-method form does not open
    And that contract still bills against the method it had

  @AC-8 @manager @mutation @negative-control
  Scenario: I am not offered a payment-method change on a subscription delegated to me
    Given I have a subscription delegated to me open in the manager, paying by one of its owner's stored methods
    When I try to change how it is paid for
    Then the payment-method form does not open
    And that contract still bills against the method it had

  @AC-8 @manager @mutation @negative-control
  Scenario: Nothing is sent when I select no method at all
    Given I have my active subscription open in the manager, paying by one of my stored methods
    And I have opened the payment-method form
    When I submit the payment-method form with no method chosen
    Then that contract still bills against the method it had

  @AC-8 @manager @mutation @negative-control
  Scenario: Nothing is sent when I select the method my contract already uses
    Given I have my active subscription open in the manager, paying by one of my stored methods
    And I have opened the payment-method form
    When I submit the payment-method form with the method my contract already uses
    Then that contract still bills against the method it had

  @AC-8 @manager @mutation
  Scenario: Close the payment-method form without changing how my contract is paid for
    Given I have my active subscription open in the manager, paying by one of my stored methods
    And I have opened the payment-method form, with a different stored card chosen
    When I close the payment-method form
    Then the payment-method form is closed and that contract still bills against the method it had
    And the next time I open the payment-method form it starts on the method my contract pays with

  # `@held-write` tells the replay to hold this scenario's recorded write answers
  # (`scenarioTiming`), so the step can observe the change in progress before it
  # lands. A replay-time timing concern, not a recorded value.
  @AC-8 @manager @mutation @held-write
  Scenario: While my payment-method change is being sent I am told it is in progress
    Given I have my active subscription open in the manager, paying by one of my stored methods
    And I have opened the payment-method form, with a different stored card chosen
    When I submit the payment-method form and the change has not landed yet
    Then I am told the change is in progress
    And once it lands I am told it is done, and that contract bills against the method I chose

@scope @FE-3239
Feature: A context names what is being read, never who it belongs to
  As a module author
  I want a context member to declare whether it names an entity or names a choice
  So that a second thing to read is a context in the scope registry, and never a
  private keying axis built beside it

  A RETARGET context names the entity the actor acts upon, and requires its id.
  A SELECTOR context names which of several things is being read, and forbids
  one — the type is the whole answer. The two are mutually exclusive, and the
  module's scope matrix declares which a member is.

  Background:
    Given a module whose scope matrix declares, for one actor, a retarget context and two selector contexts

  @AC-1 @layer-unit
  Scenario: Two catalogues read through one module stay separate
    # Protects against: the second catalogue being served the first one's cached
    # data, because nothing keyed the instance on which catalogue was asked for.
    # This is the gap FE-3034 filled with a private registration name and memo.
    Given the actor has read the first catalogue
    When the actor reads the second catalogue
    Then the two reads are separate instances
    And reading the first catalogue again returns the instance it already had
    And neither read has an entity attributed to it

  @AC-3 @layer-unit
  Scenario: A catalogue read is addressable by the catalogue alone
    # Protects against: the read filed under an address that still carries an
    # entity slot with nothing in it, so every catalogue of every module lands
    # in one place and the second read is served the first one's data.
    Given a catalogue read that names no entity
    When the read is filed among the live scopes
    Then it is filed under the catalogue alone
    And it is never filed where a retargeted read of the same module is filed

  @AC-4 @layer-unit
  Scenario: Naming a catalogue leaves a retargeted read untouched
    # Protects against: a shared-core change re-keying the 18 composables that
    # already retarget, emptying every cached instance on deploy.
    Given a retargeted read of a named entity
    When a catalogue read is introduced alongside it
    Then the retargeted read resolves to the instance it always did

  @AC-2 @layer-unit
  Scenario: A retarget context still demands the entity it targets
    # Protects against: the entity silently omitted, so the read falls back to
    # the session's own data and serves one actor another's view — FE-2824.
    When the author names a retarget context without the entity
    Then the module refuses the read

  @AC-2 @layer-unit
  Scenario: A catalogue read refuses an entity id
    # Protects against: an owner id smuggled through the context channel, which
    # is the misuse the amendment forbids and FE-3240 exists to clean up.
    When the author names a selector context together with an entity
    Then the module refuses the read

  @AC-9 @layer-integration
  Scenario: A read made on behalf of a named client still addresses that client
    # Protects against: the FE-2824 identity surface. Once a context may carry
    # no entity, the seam that resolves WHICH client a request addresses can
    # answer "nobody" without anything going red — and the request is built
    # around that answer instead of falling back to the session's own client.
    Given a read is made on behalf of a named client
    When the module fetches that client's records
    Then the request addresses the named client
    And it carries the session credentials chosen for that read

  @AC-9 @layer-integration
  Scenario: A read that names no entity is still made as the actor's own account
    # Protects against: an entity-less context answering "nobody" as the
    # identity, so the request is built around that answer rather than the
    # account actually signed in. This is the arm the optional entity opened,
    # and nothing in the type system reports it.
    Given a read that names a context but names no entity
    When the module fetches the records that context names
    Then the request addresses the actor's own account
    And no other account's records are addressed

  @AC-5 @layer-unit
  Scenario: The inspector reports a catalogue read without inventing an entity
    # Protects against: the brand filter being reported as the entity being
    # acted upon, sending an operator to debug a scope that does not exist.
    Given a catalogue read that is also filtered to a brand
    When the operator inspects the live scopes
    Then the catalogue is reported as the context
    And no entity is reported
    And the brand filter is reported as the brand it filters to

// -----------------------------------------------------------------------------
/**
 * @module scenarios/testing/synthetic.scenario
 * @description Framework-owned synthetic scenario declaration for testing.
 * Replaces imports from client-email in framework specs per operator ruling 5
 * (the framework is generic) and pseudo-nathan audit finding #3.
 *
 * This is INPUT DATA the framework consumes, not a stub standing in for a
 * dependency. Precedent: `feature-tracks.spec.ts` already uses a synthetic
 * `.feature` the spec fully controls.
 */

import { defineSteps, SCOPE_ACTOR } from "@upmind-automation/scenario-harness";
import type {
  LiveCompositionCell,
  LiveActions,
  LiveContext,
  LiveMeta
} from "../runtime/composables/useCompositionPort.types";
import type {
  DeclaredHandoff,
  FourLayerComposable,
  ScenarioDeclaration,
  ScenarioScopedCell,
  TableUischema,
  CardUischema,
  DetailUischema,
  ActionsUischema
} from "../runtime/scenario.types";
import type { ScopeActorTypes } from "@upmind-automation/headless";
import type {
  StepCatalog,
  WorldScope
} from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------
// Synthetic data — rows the framework can render without touching client-email

export const SYNTHETIC_KEY = "synthetic";

/** A minimal row shape the framework can render. */
export type SyntheticRow = {
  id: string;
  title: string;
  status: string;
  createdAt: { date: string; relative: string };
  meta: { isActive: boolean };
};

/** A row the framework specs can assert against. */
export const syntheticRow: SyntheticRow = {
  id: "syn-001",
  title: "Synthetic Record",
  status: "active",
  createdAt: { date: "2026-01-01T00:00:00Z", relative: "2026-01-01" },
  meta: { isActive: true }
};

/** A second row for list assertions. */
export const syntheticRow2: SyntheticRow = {
  id: "syn-002",
  title: "Second Record",
  status: "inactive",
  createdAt: { date: "2026-01-02T00:00:00Z", relative: "2026-01-02" },
  meta: { isActive: false }
};

export const syntheticRows: SyntheticRow[] = [syntheticRow, syntheticRow2];

// -----------------------------------------------------------------------------
// Synthetic composable — minimal shape that satisfies FourLayerComposable

const syntheticActions: LiveActions = {
  create: () => Promise.resolve(),
  update: () => Promise.resolve(),
  remove: () => Promise.resolve()
};

const syntheticContext: LiveContext = {
  data: { value: syntheticRows },
  error: { value: null },
  isLoading: { value: false },
  isError: { value: false }
};

const syntheticMeta: LiveMeta = {
  canCreate: true,
  canUpdate: true,
  canDelete: true
};

const syntheticCell: LiveCompositionCell = {
  useActions: () => syntheticActions,
  useContext: () => syntheticContext,
  useMeta: () => syntheticMeta
};

const syntheticScopedCell: ScenarioScopedCell = {
  ...syntheticCell,
  for: () => syntheticCell,
  withId: function () {
    return this;
  },
  fresh: () => syntheticCell
};

/**
 * A minimal FourLayerComposable for framework tests. Does not instantiate any
 * real scope or make any API calls.
 */
export const useSyntheticList: FourLayerComposable = Object.assign(
  () => ({
    as: (_actor: ScopeActorTypes) => syntheticScopedCell
  }),
  { scopeMatrix: { client: {}, staff: { client: {} } } }
);

export const useSyntheticMutate: FourLayerComposable = Object.assign(
  () => ({
    as: (_actor: ScopeActorTypes) => syntheticScopedCell
  }),
  { scopeMatrix: { client: {}, staff: { client: {} } } }
);

// -----------------------------------------------------------------------------
// Synthetic presentation — minimal uischemas for framework rendering tests

export const syntheticTableUischema: TableUischema = {
  type: "TableLayout",
  elements: [
    {
      type: "TableCellIcon",
      scope: "#/properties/meta/properties/isActive",
      options: { width: "auto" }
    },
    {
      type: "TableCellText",
      scope: "#/properties/title",
      options: { width: "2fr" }
    },
    {
      type: "TableCellBadge",
      scope: "#/properties/status",
      options: { width: "1fr" }
    },
    {
      type: "TableCellText",
      scope: "#/properties/createdAt/properties/relative",
      options: { width: "1fr" }
    }
  ]
};

export const syntheticCardUischema: CardUischema = {
  type: "CardLayout",
  elements: [
    { type: "CardCellText", scope: "#/properties/title" },
    { type: "CardCellBadge", scope: "#/properties/status" }
  ]
};

export const syntheticDetailUischema: DetailUischema = {
  type: "DetailLayout",
  elements: [
    { type: "DetailField", scope: "#/properties/title", label: "Title" },
    { type: "DetailField", scope: "#/properties/status", label: "Status" }
  ]
};

export const syntheticActionsUischema: ActionsUischema = {
  type: "ActionsLayout",
  elements: [
    {
      type: "ScenarioAction",
      scope: "#",
      name: "edit",
      options: { verb: "edit", i18n: "action.edit", placement: "row" }
    },
    {
      type: "ScenarioAction",
      scope: "#",
      name: "remove",
      options: { verb: "remove", i18n: "action.remove", placement: "row" }
    },
    {
      type: "ScenarioAction",
      scope: "#",
      name: "setDefault",
      options: {
        verb: "setDefault",
        i18n: "action.setDefault",
        placement: "row"
      }
    },
    {
      type: "ScenarioAction",
      scope: "#",
      name: "verify",
      options: { verb: "verify", i18n: "action.verify", placement: "row" }
    },
    {
      type: "ScenarioAction",
      scope: "#",
      name: "view",
      options: { verb: "view", i18n: "action.view", placement: "row" }
    },
    {
      type: "ScenarioAction",
      scope: "#",
      name: "ensure",
      options: {
        verb: "ensure",
        i18n: "action.ensure",
        placement: "collection"
      }
    }
  ]
};

// -----------------------------------------------------------------------------
// Synthetic feature text and step catalog for tracks testing

export const SYNTHETIC_CLIENT_SCOPE: WorldScope = { actor: SCOPE_ACTOR.CLIENT };

export const SYNTHETIC_STAFF_SCOPE: WorldScope = {
  actor: SCOPE_ACTOR.STAFF,
  context: { type: "client", id: "mock-client-id" }
};

export const syntheticFeatureText = `
Feature: Synthetic module for framework testing
  Background:
    Given the framework is ready

  Scenario: Framework can render a list
    Given a synthetic module declaration
    When the list surface mounts
    Then rows are displayed

  Scenario: Framework can render a card
    Given a synthetic module declaration
    When the card surface mounts
    Then cards are displayed
`;

export const syntheticStepCatalog: StepCatalog = defineSteps(steps => {
  steps.Given("the framework is ready", async () => {
    // no-op setup step
  });

  steps.Given("a synthetic module declaration", async () => {
    // no-op — the declaration is the test fixture
  });

  steps.When("the list surface mounts", async () => {
    // no-op — mounting is the spec's job
  });

  steps.When("the card surface mounts", async () => {
    // no-op — mounting is the spec's job
  });

  steps.Then("rows are displayed", async () => {
    // no-op — assertion is the spec's job
  });

  steps.Then("cards are displayed", async () => {
    // no-op — assertion is the spec's job
  });
});

// -----------------------------------------------------------------------------
// Synthetic handoffs for framework tests

export const syntheticHandoffs: Record<string, DeclaredHandoff> = {
  add: {
    key: "add",
    label: "Add New",
    i18n: "handoff.add"
  },
  edit: {
    key: "edit",
    label: "Edit",
    i18n: "handoff.edit"
  },
  view: {
    key: "view",
    label: "View Details",
    i18n: "handoff.view"
  }
};

// -----------------------------------------------------------------------------
// The declaration itself

export const syntheticScenario: ScenarioDeclaration = {
  key: SYNTHETIC_KEY,
  useList: useSyntheticList,
  useMutate: useSyntheticMutate,
  handoff: syntheticHandoffs,
  presentation: {
    icon: "box",
    table: syntheticTableUischema,
    card: syntheticCardUischema,
    detail: syntheticDetailUischema,
    actions: syntheticActionsUischema
  }
};

export default syntheticScenario;

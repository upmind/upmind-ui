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
// Email-shaped rows — replacement for recorded-emails.ts
// These match the Email row shape specs expect, without importing client-email.

/** Email-shaped row for framework tests. */
export type SyntheticEmailRow = {
  id: string;
  email: string;
  title: string;
  bouncedAt?: { date: string; relative: string };
  createdAt: { date: string; relative: string };
  meta: {
    isDefault: boolean;
    canDelete: boolean;
    isVerified: boolean;
    isBounced: boolean;
  };
};

/** A default, verified email row — equivalent to recorded defaultRow. */
export const defaultRow: SyntheticEmailRow = {
  id: "syn-email-001",
  email: "default@synthetic.test",
  title: "default@synthetic.test",
  createdAt: { date: "2026-01-01T00:00:00Z", relative: "2026-01-01" },
  meta: {
    isDefault: true,
    canDelete: false,
    isVerified: true,
    isBounced: false
  }
};

/** An unverified email row — equivalent to recorded unverifiedRow. */
export const unverifiedRow: SyntheticEmailRow = {
  id: "syn-email-002",
  email: "unverified@synthetic.test",
  title: "unverified@synthetic.test",
  createdAt: { date: "2026-01-02T00:00:00Z", relative: "2026-01-02" },
  meta: {
    isDefault: false,
    canDelete: true,
    isVerified: false,
    isBounced: false
  }
};

/** The same row after verification — equivalent to recorded verifiedRow. */
export const verifiedRow: SyntheticEmailRow = {
  ...unverifiedRow,
  meta: { ...unverifiedRow.meta, isVerified: true }
};

/** A bounced email row for bounce-related tests. */
export const bouncedRow: SyntheticEmailRow = {
  id: "syn-email-003",
  email: "bounced@synthetic.test",
  title: "bounced@synthetic.test",
  bouncedAt: { date: "2026-01-03T00:00:00Z", relative: "2026-01-03" },
  createdAt: { date: "2026-01-01T00:00:00Z", relative: "2026-01-01" },
  meta: {
    isDefault: false,
    canDelete: true,
    isVerified: false,
    isBounced: true
  }
};

/** Synthetic API error message for rejection tests. */
export const API_MESSAGE = "Cannot set unverified email as default";

/** Synthetic rejection error for error-handling tests. */
export function recordedRejection(): Error {
  return Object.assign(new Error(API_MESSAGE), {
    code: 409,
    data: null,
    origin: "upmind"
  });
}

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

/** Loading state context for skeleton tests — isLoading stays true. */
const syntheticLoadingContext: LiveContext = {
  data: { value: null },
  error: { value: null },
  isLoading: { value: true },
  isError: { value: false }
};

const syntheticMeta: LiveMeta = {
  isServed: true,
  isLoading: false,
  canCreate: true,
  canUpdate: true,
  canDelete: true
};

/** Loading meta — isLoading true so FormFlowSurface renders skeletons. */
const syntheticLoadingMeta: LiveMeta = {
  isServed: true,
  isLoading: true,
  canCreate: true,
  canUpdate: true,
  canDelete: true
};

const syntheticCell: LiveCompositionCell = {
  useActions: () => syntheticActions,
  useContext: () => syntheticContext,
  useMeta: () => syntheticMeta
};

/** Loading cell for skeleton tests — useContext and useMeta return loading state. */
const syntheticLoadingCell: LiveCompositionCell = {
  useActions: () => syntheticActions,
  useContext: () => syntheticLoadingContext,
  useMeta: () => syntheticLoadingMeta
};

const syntheticScopedCell: ScenarioScopedCell = {
  ...syntheticCell,
  for: () => syntheticCell,
  withId: function () {
    return this;
  },
  fresh: () => syntheticCell
};

/** Loading scoped cell for skeleton tests. */
const syntheticLoadingScopedCell: ScenarioScopedCell = {
  ...syntheticLoadingCell,
  for: () => syntheticLoadingCell,
  withId: function () {
    return this;
  },
  fresh: () => syntheticLoadingCell
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

/** Loading composable for skeleton tests — stays in loading state. */
export const useSyntheticMutateLoading: FourLayerComposable = Object.assign(
  () => ({
    as: (_actor: ScopeActorTypes) => syntheticLoadingScopedCell
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

const SYNTHETIC_FEEDBACK = {
  success: "confirm.saved",
  failure: "error.save_failed"
};

export const syntheticHandoffs: Record<string, DeclaredHandoff> = {
  add: {
    feedback: SYNTHETIC_FEEDBACK
  },
  edit: {
    context: { type: "synthetic", from: "/id" },
    feedback: SYNTHETIC_FEEDBACK
  },
  view: {
    context: { type: "synthetic", from: "/id" }
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

import type { ScopeActor } from "../world/scope-actor";

/**
 * The @AC-5 exemplar module (design §4) — a plain-TS stand-in for a real
 * scope-based composable's four-layer shape (actions/context/meta/internals),
 * used only to prove the feature → catalog → world plumbing. No reactivity
 * library: `meta`/`context` members are plain getters over a closured state
 * object, so a fresh read after a fired action always sees the current value.
 */
interface FixtureState {
  on: boolean;
  label: string;
}

function createFixtureActions(state: FixtureState) {
  return {
    turnOn(): void {
      state.on = true;
    },
    turnOff(): void {
      state.on = false;
    },
    rename(input: { label: string }): void {
      state.label = input.label;
    }
  };
}

function createFixtureContext(state: FixtureState) {
  return {
    get label(): string {
      return state.label;
    }
  };
}

function createFixtureMeta(state: FixtureState) {
  return {
    get isOn(): boolean {
      return state.on;
    },
    get hasLabel(): boolean {
      return state.label.length > 0;
    }
  };
}

function createFixtureInternals(actor: ScopeActor, state: FixtureState) {
  return { actor, state };
}

export interface FixtureModule {
  actions: ReturnType<typeof createFixtureActions>;
  context: ReturnType<typeof createFixtureContext>;
  meta: ReturnType<typeof createFixtureMeta>;
  internals: ReturnType<typeof createFixtureInternals>;
}

export function createFixtureModule(actor: ScopeActor): FixtureModule {
  const state: FixtureState = { on: false, label: "" };

  return {
    actions: createFixtureActions(state),
    context: createFixtureContext(state),
    meta: createFixtureMeta(state),
    internals: createFixtureInternals(actor, state)
  };
}

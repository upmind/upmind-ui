import type { ScopeActor } from "../world/scope-actor";

/**
 * The @AC-5 exemplar module's plain-TS state shape and its
 * four-layer (actions/context/meta/internals) return shape.
 */
export type FixtureState = {
  on: boolean;
  label: string;
};

export type FixtureModule = {
  actions: {
    turnOn(): void;
    turnOff(): void;
    rename(input: { label: string }): void;
  };
  context: {
    readonly label: string;
  };
  meta: {
    readonly isOn: boolean;
    readonly hasLabel: boolean;
  };
  internals: {
    actor: ScopeActor;
    state: FixtureState;
  };
};

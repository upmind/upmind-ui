// -----------------------------------------------------------------------------
/**
 * @module tests/journeys/scenario-harness/bridge-world
 * @description The Node-executor lane's typed `World` skeleton over the
 * `window.Upmind` bridge channel — `initTestMode`,
 * `packages/headless/src/useUpmind.ts:424-431`, attached when `apps/cart`
 * boots in test mode. Ships as a typed skeleton only: the runnable bridge
 * world arrives with the first FE-2968 module through this lane. `boot()`
 * rejecting with {@link BRIDGE_WORLD_NOT_IMPLEMENTED} is a loud "nobody
 * ships this silently" marker rather than a silent no-op.
 */

import type {
  ComposableKey,
  World,
  WorldScope
} from "@upmind-automation/scenario-harness";

export const BRIDGE_WORLD_NOT_IMPLEMENTED =
  "bridge-world: not implemented — the runnable bridge world ships with the first FE-2968 module";

export class BridgeWorld implements World {
  async boot(_key: ComposableKey, _scope: WorldScope): Promise<void> {
    throw new Error(BRIDGE_WORLD_NOT_IMPLEMENTED);
  }

  async fire(_actionId: string, _input?: unknown): Promise<void> {
    throw new Error(BRIDGE_WORLD_NOT_IMPLEMENTED);
  }

  async expectMeta(_expected: Partial<Record<string, boolean>>): Promise<void> {
    throw new Error(BRIDGE_WORLD_NOT_IMPLEMENTED);
  }

  async dispose(): Promise<void> {
    throw new Error(BRIDGE_WORLD_NOT_IMPLEMENTED);
  }
}

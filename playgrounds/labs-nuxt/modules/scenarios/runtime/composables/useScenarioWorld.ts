// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/composables/useScenarioWorld
 * @description The IN-PAGE `World` — the BDD execution seam driven against the
 * live composables the playground already renders, so one `.feature` runs here
 * and through the Playwright bridge without a second implementation of the
 * scenario.
 *
 * Registry-generic: it holds no module knowledge at all. `boot` looks the key
 * up in the scenario contract (`registry.ts`) and everything else reads the
 * seam port, exactly as `NodeWorld` does over its fixture modules.
 */

import {
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "@upmind-automation/headless";
import {
  fireArgv,
  matchesExpectation
} from "@upmind-automation/scenario-harness";
import { registry } from "../registry";
import { useModulePort } from "./useModulePort";
import { useScenarioStage } from "./useScenarioStage";
import {
  get,
  isEmpty,
  isEqual,
  isFunction,
  isNumber,
  isString,
  keys,
  mapValues,
  omit,
  pick
} from "lodash-es";
import type { ScenarioBinding, ScenarioKey } from "../scenario.types";
import type { ModulePort } from "./useModulePort.types";
import type { ScopeActorTypes } from "@upmind-automation/headless";
import type { World, WorldScope } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** Every failure here is a harness-authoring mistake, surfaced as the module error shape. */
/** Long enough for a hand to see the editor arrive, and its fields fill. */
const STEP_BEAT_MS = 700;

/** How long a press is given to open an editor before it plainly did not. */
const EDITOR_WAIT_MS = 400;

/** A pause the user can actually watch a step happen in. */
function beat(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, STEP_BEAT_MS));
}

function fail(message: string): never {
  throw new DetailedError(
    `scenario world: ${message}`,
    responseCodes.Bad_Request,
    ErrorOrigin.Headless
  );
}

/**
 * Serialises a snapshot layer to a searchable string, dropping cycles so a
 * whole-layer substring search never throws on a reactive handle.
 */
function searchable(snapshot: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(snapshot, (_key, val) => {
    if (typeof val === "object" && val !== null) {
      if (seen.has(val)) return undefined;
      seen.add(val);
    }
    return val;
  });
}

/**
 * What a SELF-DRAWN page tells the world about the cell IT has already booted
 * (`ScenarioBinding.useManage`). Absent — which is every page the shared
 * `ScenarioPlayground` hosts — the world behaves exactly as it always has.
 *
 * It exists because such a page is addressed by a url ROUTE PARAM
 * (`/useTicket/<id>`) and a step catalog cannot
 * name that id: the catalog is one file serving every ticket, and a literal in
 * it would be a second scope beside the url's. So the track declares the ACTOR
 * and the page completes the record — one scope, the url's, read once.
 */
export type ScenarioWorldHost = {
  /** The key the page renders itself — the one cell the world adopts. */
  key: ScenarioKey;
  /** The scope context the page's own url names, completing a boot that names none. */
  context?: WorldScope["context"];
  /**
   * The ONE record the page's own url names — its `.withId(id)` — completing a
   * boot the same way `context` does, for a page whose subject is an INSTANCE
   * rather than a relationship the actor acts upon.
   *
   * It is a sibling of `context`, not a rename: a page may carry either, and
   * the two are different axes (a staff cell could act FOR a client and read
   * ONE of that client's records). `useModulePort` already boots `.withId`.
   */
  id?: string;
};

/** One booted port, plus the scope that booted it, held under its scenario key. */
type LiveCell = { scope: WorldScope; port: ModulePort };

/**
 * Builds the in-page world over the scenario contract.
 *
 * @param bindings The scenario contract, defaulted to this playground's own
 * registry and overridable so a spec can drive a narrowed set.
 * @param host The self-drawn page's own booted cell, where one hosts this
 * world. See {@link ScenarioWorldHost}.
 */
export function useScenarioWorld(
  bindings: Record<ScenarioKey, ScenarioBinding> = registry,
  host?: ScenarioWorldHost
): World<ScenarioKey> {
  // One live cell PER scenario key — parity with the Node world
  // (`node-world.ts`): booting a key replaces only THAT key's cell, and cells
  // under different keys (a list and any number of editors) live together. This
  // is what lets a scenario hold two editor cells at once — two image fields
  // under two keys re-uploading independently (client-custom-fields AC-22).
  const live = new Map<ScenarioKey, LiveCell>();

  /** The key booted last — the cell a step addresses when it names no key. */
  let lastKey: ScenarioKey | undefined;

  /** The action a `fireHold` left running on a port, awaited by `settle`. */
  const inflight = new Map<ModulePort, Promise<unknown>>();

  /**
   * The port a step targets: the one booted under `key` when a step names one,
   * else the last-booted cell. A named key no live cell booted is a refusal.
   */
  function targetPort(key?: ScenarioKey): ModulePort {
    if (key !== undefined) {
      const entry = live.get(key);
      if (!entry) fail(`no live cell for key "${key}"`);
      return entry.port;
    }

    if (lastKey === undefined || !live.has(lastKey))
      fail("boot() has not been called yet");
    return live.get(lastKey)!.port;
  }

  /**
   * Disposes ONE key's live cell, keeping the rest. The HOST page's own cell is
   * never destroyed here: the page renders it and owns its lifetime, tearing it
   * down on unmount, so destroying it because the next track boots a different
   * key would kill the surface the replay is playing on (the same reason
   * `disarm()` disposes nothing, design §7.1). The world lets it go instead, and
   * the scope registry hands the same cell back on the next boot.
   */
  function disposeKey(key: ScenarioKey): void {
    const entry = live.get(key);
    if (!entry) return;

    const isHosted = !!host && key === host.key;
    const destroy = get(entry.port.actions, "destroy");
    if (!isHosted && isFunction(destroy)) destroy();
    live.delete(key);
  }

  function dispose(): void {
    for (const key of [...live.keys()]) disposeKey(key);
    lastKey = undefined;
  }

  return {
    async boot(key, scope: WorldScope) {
      // The scope registry caches by scope key, so a live port IS the cell the
      // page renders: re-booting the same key+scope ADOPTS the cell that holds
      // it, because disposing would `destroy()` the rendered surface mid-track.
      const existing = live.get(key);
      if (existing && isEqual(existing.scope, scope)) {
        lastKey = key;
        return;
      }

      const entry = get(bindings, key);
      if (!entry) fail(`unknown scenario key "${key}"`);

      // The harness's `ScopeActor` is a documented mirror of `ScopeActorTypes`
      // over the vue-free source enum (`world/scope-actor.ts`), sharing its
      // wire values — so a feature may name the actor and it lands as the
      // enum the scope builder takes. `WorldScope.context` is already the
      // complete `{ type, id }` pair a scope is only ever expressed as.
      // `useManage` last, exactly as `registry.ts` orders them: a declaration
      // binding a renderer keeps the cell it always booted.
      // The host page's url completes a boot scope that names no context — the
      // SAME scope the page itself booted, so the scope registry hands back the
      // cell already on screen rather than a second one.
      const resolvedContext =
        scope.context ?? (host?.key === key ? host.context : undefined);
      // The same completion for a single-record page: the step boots the manager
      // naming no record, and the page's url says which one.
      const resolvedId = scope.id ?? (host?.key === key ? host.id : undefined);

      // A bare boot (no context, no id) keys under the module's BASE scope key,
      // which a list and its editor share. With any other cell already live it
      // would adopt that cell from the scope registry — a second editor adopting
      // the first, or the editor adopting the live list — so boot a DISTINCT
      // instance instead (`useModulePort` `fresh`), exactly as the Node world
      // does. The host key is exempt: that boot must reuse the page's own
      // rendered cell, never a second instance.
      const isHostKey = !!host && host.key === key;
      const needFresh =
        live.size > 0 && !resolvedContext && !resolvedId && !isHostKey;

      const built = useModulePort(
        (entry.useList ?? entry.useMutate ?? entry.useManage)!,
        {
          actor: scope.actor as ScopeActorTypes,
          context: resolvedContext,
          id: resolvedId,
          fresh: needFresh
        }
      );

      // Keep every other key's live cell; dispose only a PREVIOUS cell booted
      // under THIS key, then hold the new one under it.
      disposeKey(key);
      live.set(key, { scope, port: built });
      lastKey = key;
    },

    async fire(actionId, input, key) {
      // The screen first, always. A step is a PRESS: it runs the control's own
      // closure, so the spinner turns, the toast lands, and a handoff opens its
      // editor over the list — the whole point of watching a replay.
      const stage = useScenarioStage();
      const rowId = isString(input)
        ? input
        : (get(input, "id") as string | undefined);

      if (stage.offers(actionId, rowId)) {
        await stage.press(actionId, rowId);

        // A control that opens a form has not finished until the form is
        // submitted — that IS the rest of the press, as a hand would make it.
        const editor = await stage
          .whenEditor(EDITOR_WAIT_MS)
          .catch(() => undefined);
        if (editor) {
          // Held, deliberately. All of it in one tick puts the editor on screen
          // for less than a frame, which reads as the invisible replay this
          // seam exists to replace.
          await beat();

          const fields = omit((input ?? {}) as Record<string, unknown>, "id");
          if (!isEmpty(fields)) {
            editor.fill(fields);
            await beat();
          }

          await editor.submit();
        }

        return;
      }

      // No screen at all — the Node runner, and the playability probe that boots
      // a track without mounting it. Nothing else may take this branch.
      const action = get(targetPort(key).actions, actionId);

      // Neither on the stage nor on the port. A handoff id (`manage`,
      // `editRow`, `add`, `edit`) lives ONLY on a mounted surface, and a deep
      // link (`?track=…&scene=1`) fires its first scene while that surface is
      // still mounting — so `offers()` above answered false for a control that
      // was late, not absent, and this branch reported `unknown action`.
      // Wait for the surface once, then press it. A control that genuinely
      // never arrives still fails, and the Node runner (where no surface ever
      // registers) pays the wait only on an id that was going to throw anyway.
      if (!isFunction(action)) {
        if (await stage.whenStaged()) {
          if (stage.offers(actionId, rowId)) {
            await stage.press(actionId, rowId);

            const late = await stage
              .whenEditor(EDITOR_WAIT_MS)
              .catch(() => undefined);
            if (late) {
              await beat();

              const fields = omit(
                (input ?? {}) as Record<string, unknown>,
                "id"
              );
              if (!isEmpty(fields)) {
                late.fill(fields);
                await beat();
              }

              await late.submit();
            }

            return;
          }
        }

        fail(`unknown action "${actionId}"`);
      }

      await (action as (...values: unknown[]) => unknown)(...fireArgv(input));
    },

    async fireHold(actionId, input, key) {
      // No stage press: an in-flight save is a PORT action (`update`), held open
      // by the recording's `delayMs` so the next step observes `isProcessing`.
      // Its rejection is swallowed here so nothing escapes between steps; `settle`
      // surfaces (or, per AC13, ignores) it.
      const port = targetPort(key);
      const action = get(port.actions, actionId);
      if (!isFunction(action)) fail(`unknown action "${actionId}"`);
      const pending = Promise.resolve(
        (action as (...values: unknown[]) => unknown)(...fireArgv(input))
      ).catch(() => undefined);
      inflight.set(port, pending);
    },

    async settle(key) {
      const port = targetPort(key);
      const pending = inflight.get(port);
      if (!pending) return;
      inflight.delete(port);
      await pending;
    },

    async expectMeta(expected, key) {
      // `rawMeta()` deref's without coercing, so a number-valued member reads as
      // itself; `getMeta()` is the unserved-scope fallback. Each expected key is
      // then read per its expectation — a number expectation keeps the raw value
      // (an exact compare), every other is coerced to a real boolean, exactly as
      // the Node world grades it (`node-world.ts`).
      const port = targetPort(key);
      const raw = port.rawMeta?.() ?? port.getMeta();
      const view = mapValues(raw, (value, name) =>
        isNumber(get(expected, name)) ? value : !!value
      );
      if (!matchesExpectation(view, expected))
        fail(
          `meta mismatch — expected ${JSON.stringify(expected)}, got ${JSON.stringify(pick(view, keys(expected)))}`
        );
    },

    // The harness's one reading of an expectation, shared with the Node
    // replay: an expected `null` is a CLEARED value (`matchesExpectation`).
    async expectContext(expected, key) {
      const liveContext = targetPort(key).snapshot().context;
      if (!matchesExpectation(liveContext, expected))
        fail(
          `context mismatch — expected ${JSON.stringify(expected)}, got ${JSON.stringify(pick(liveContext, keys(expected)))}`
        );
    },

    async expectAbsent(value, key) {
      const { context, meta } = targetPort(key).snapshot();
      if (searchable({ context, meta }).includes(value))
        fail(
          `expected "${value}" to appear nowhere in the addressed cell's published context or meta, but it does`
        );
    },

    async dispose() {
      dispose();
    }
  };
}

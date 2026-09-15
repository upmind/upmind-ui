// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications token cell — link-token containment
 * (integration, AC-18, `design.md` §D19)
 *
 * ## Job To Be Done
 * The emailed link token is a bearer credential — possession is authorisation.
 * Prove it is unreachable from every published door: the manager's public
 * context, the raw machine state `useInternals()` exposes, and any queryKey a
 * consumer can read. Then prove containment did not cost the capability it
 * protects — a client following the link still reads and saves.
 *
 * ## What Breaks If These Fail
 * A link token reaches a published door, a thrown error, or a cache key a
 * consumer (or a monitoring/log sink) can read — the exact credential-leak
 * shape `design.md` §D19 closes. Or containment over-corrects and a link
 * stops working at all — a worse outcome than the leak it fixes.
 */

import { describe, expect, it, vi } from "vitest";
import { unref } from "vue";
import { useClientNotifications, useClientNotificationsManager } from "..";
import {
  installNotificationsReadWriteHandlers,
  seedGuestFloor
} from "./client-notifications.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const SECRET_TOKEN = "tok-secret-9f3c1a";

/**
 * Recursively walks every reachable value off a published door, unwrapping
 * Vue refs/computed at each level, looking for the literal credential.
 * Functions are never invoked (a deep walk inspects VALUES, not behaviour),
 * and a `WeakSet` guards against a reactive graph's own cycles.
 */
function deepContainsLiteral(
  value: unknown,
  literal: string,
  seen: WeakSet<object> = new WeakSet()
): boolean {
  if (typeof value === "string") return value.includes(literal);
  if (value === null || value === undefined || typeof value === "function") {
    return false;
  }
  const unwrapped = unref(value as never);
  if (unwrapped !== value) return deepContainsLiteral(unwrapped, literal, seen);
  if (typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) {
    return value.some(item => deepContainsLiteral(item, literal, seen));
  }
  return Object.keys(value).some(key =>
    deepContainsLiteral((value as Record<string, unknown>)[key], literal, seen)
  );
}

// -----------------------------------------------------------------------------

describe("AC-18 — no credential reaches the public surface", () => {
  it("the manager's public context (useContext() + useMeta()) carries no occurrence of the token", async () => {
    await seedGuestFloor();
    installNotificationsReadWriteHandlers(server);

    const manager = useClientNotificationsManager()
      .as("client")
      .withId(SECRET_TOKEN);
    await manager.useActions().isReady();

    expect(deepContainsLiteral(manager.useContext(), SECRET_TOKEN)).toBe(false);
    expect(deepContainsLiteral(manager.useMeta(), SECRET_TOKEN)).toBe(false);
  });

  it("useInternals()'s raw state carries no token — state.value.context carries no `token` key or value", async () => {
    await seedGuestFloor();
    installNotificationsReadWriteHandlers(server);

    const manager = useClientNotificationsManager()
      .as("client")
      .withId(SECRET_TOKEN);
    await manager.useActions().isReady();

    const context = manager.useInternals().state.value.context as Record<
      string,
      unknown
    >;
    expect(Object.keys(context)).not.toContain("token");
    expect(deepContainsLiteral(context, SECRET_TOKEN)).toBe(false);
  });

  it("no queryKey a consumer can read carries the token — the collection's internals publish only the stable prefix", async () => {
    await seedGuestFloor();
    installNotificationsReadWriteHandlers(server);

    const collection = useClientNotifications()
      .as("client")
      .withId(SECRET_TOKEN);
    await vi.waitFor(() =>
      expect(collection.useActions().isReady()).resolves.toBe(true)
    );

    const { query } = collection.useInternals();
    expect(deepContainsLiteral(query.topics.queryKey, SECRET_TOKEN)).toBe(
      false
    );
    expect(deepContainsLiteral(query.channels.queryKey, SECRET_TOKEN)).toBe(
      false
    );
    expect(deepContainsLiteral(query.optOuts.queryKey, SECRET_TOKEN)).toBe(
      false
    );
  });

  // Not independently provable via this module's public surface: forcing the
  // construction-time throw (`!actorRef`, `useClientNotificationsManager.ts`)
  // has no reachable trigger through `.as()`/`.withId()`/`.useActions()` —
  // every malformed-token input tried (empty string, oversized string, null,
  // undefined, an object) constructs without throwing. The line's OWN
  // containment (`{ scope: scopeKey }`, never `{ scope: config }`) is
  // asserted by construction — `scopeKey` is a string built from the actor
  // and id segments, never the raw config object the token could be read off
  // — but no test here can force that throw site to fire.
});

describe("AC-18 (capability preserved) — containment does not cost the token-following client path", () => {
  it("a client with a token still reads and saves", async () => {
    await seedGuestFloor();
    const handlers = installNotificationsReadWriteHandlers(server);

    const manager = useClientNotificationsManager()
      .as("client")
      .withId(SECRET_TOKEN);
    await manager.useActions().isReady();

    const topicId = manager
      .useContext()
      .lookups.value!.topics.find(t => t.canOptOut)!.id;
    const channelId = manager.useContext().lookups.value!.channels[0].id;

    manager.useActions().toggle(topicId, channelId);
    await vi.waitFor(() => expect(manager.useMeta().isDirty.value).toBe(true));
    await manager.useActions().update();

    expect(handlers.bodies()).toHaveLength(1);
    expect(manager.useContext().isEnabled(topicId, channelId)).toBe(false);
  });
});

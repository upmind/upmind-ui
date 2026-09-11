/**
 * @module client-notifications/__tests__/manager.input-leading-edge
 * @description The operator-reported defect: on the landed page, ticking a
 * channel made it DESELECT ITSELF and left nothing to save.
 *
 * `FormFlowSurface` is a CONTROLLED form — it binds
 * `:model-value="snapshot.context.model"` straight to the machine. `input`
 * was debounced trailing-only, so for 350ms after a click the machine's
 * model still held the OLD value, Vue re-rendered the checkbox from it, and
 * the box visibly reverted. The resulting prop change made the form re-emit
 * the baseline, and trailing-only keeps the LAST call — so the baseline was
 * what got sent, `isDirty` stayed false, and the save refused.
 *
 * ## What Breaks If These Fail
 * The page renders a preference grid that silently discards every edit —
 * the exact shape of a capability that looks delivered and is not. 734
 * integration tests and a 7/7 mount spec all passed while this was live,
 * because every one of them asserted the CALLS `input` received rather than
 * the model state a consumer reads back after the click settles.
 */

// --- external
import { beforeEach, describe, expect, it } from "vitest";
import { useClientNotificationsManager } from "..";
import {
  installNotificationsReadWriteHandlers,
  recorded,
  seedClientSession
} from "./client-notifications.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

beforeEach(async () => {
  await seedClientSession();
});

async function openManager() {
  const manager = useClientNotificationsManager().as("client");
  await manager.useActions().isReady();
  return manager;
}

function preferenceKey(topicId: string, channelId: string): string {
  return `${topicId}::${channelId}`;
}

/** The first topic a client may actually change, and one of its channels. */
function firstWritablePair() {
  const topic = recorded.topics().data.find(row => row.can_opt_out);
  if (!topic) throw new Error("no opt-outable topic in the recorded capture");
  const channel = recorded.channels().data[0];
  return { key: preferenceKey(topic.id, channel.id) };
}

describe("AC-3 — a click reaches the draft without waiting out the debounce", () => {
  it("the model carries the flipped pair BEFORE the debounce window elapses, so a controlled form never re-renders the old value", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { key } = firstWritablePair();

    const before = manager.useContext().model.value.preferences[key];
    expect(before, "the recorded capture should leave this pair enabled").toBe(
      true
    );

    // ONE call, exactly as one click produces — then read the draft back
    // without awaiting the returned promise and without advancing timers.
    // A trailing-only debounce leaves `model` untouched here, which is what
    // made the checkbox snap back on the real page.
    manager.useActions().input({
      preferences: {
        ...manager.useContext().model.value.preferences,
        [key]: false
      }
    });

    await new Promise(resolve => setTimeout(resolve, 60));

    expect(
      manager.useContext().model.value.preferences[key],
      "the draft still held the pre-click value 60ms after the click — a " +
        "controlled form re-renders from this, so the control reverts and " +
        "the user's change is lost"
    ).toBe(false);
  });

  it("that same click leaves the draft dirty, so the save is offered rather than refused", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { key } = firstWritablePair();

    manager.useActions().input({
      preferences: {
        ...manager.useContext().model.value.preferences,
        [key]: false
      }
    });

    await new Promise(resolve => setTimeout(resolve, 60));

    expect(
      manager.useMeta().isDirty.value,
      "isDirty read clean 60ms after a real change — this is the " +
        "'nothing to save' half of the operator's report"
    ).toBe(true);
  });
});

describe("AC-5 — Revert survives the form engine clearing itself first", () => {
  it("an empty preferences payload is dropped, not sent, so the draft the user is reverting still exists", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { key } = firstWritablePair();

    manager.useActions().input({
      preferences: {
        ...manager.useContext().model.value.preferences,
        [key]: false
      }
    });
    await new Promise(resolve => setTimeout(resolve, 60));
    expect(manager.useContext().model.value.preferences[key]).toBe(false);

    // Exactly what `FormHost.doReject()` emits a tick before it emits
    // `reject`: the engine clearing ITSELF, not a user instruction.
    manager.useActions().input({ preferences: {} });
    await new Promise(resolve => setTimeout(resolve, 500));

    const after = manager.useContext().model.value.preferences;
    expect(
      Object.keys(after).length,
      "the empty reset payload reached the machine and wiped the draft — " +
        "revert then has nothing coherent to restore, which is why Revert " +
        "appeared dead on the page"
    ).toBeGreaterThan(0);
    expect(after[key], "the user's own pending change was lost").toBe(false);
  });

  it("revert() then restores the saved baseline, leaving the draft clean", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { key } = firstWritablePair();

    manager.useActions().input({
      preferences: {
        ...manager.useContext().model.value.preferences,
        [key]: false
      }
    });
    await new Promise(resolve => setTimeout(resolve, 60));
    expect(manager.useMeta().isDirty.value).toBe(true);

    // The full Revert sequence, in FormHost's own order.
    manager.useActions().input({ preferences: {} });
    manager.useActions().revert();

    // PAST the 350ms DEBOUNCE_DELAY. A queued empty payload lands here and
    // overwrites the reverted draft — and `destroy()`'s `cancel()` cannot
    // save it, because Revert deliberately keeps the dialog OPEN.
    await new Promise(resolve => setTimeout(resolve, 500));

    expect(
      manager.useContext().model.value.preferences[key],
      "revert() did not restore the pair to its saved value"
    ).toBe(true);
    expect(
      manager.useMeta().isDirty.value,
      "the draft still reads dirty after a revert"
    ).toBe(false);
  });
});

describe("AC-4 — the All-channels control stays where the user puts it", () => {
  it("ticking All-channels leaves the sentinel ticked and every channel on, once the parse settles", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();

    const topic = recorded.topics().data.find(row => row.can_opt_out);
    if (!topic) throw new Error("no opt-outable topic in the recorded capture");
    const channels = recorded.channels().data;
    const sentinelKey = preferenceKey(topic.id, "__all");

    // Start from not-all-selected so the tick is a real transition.
    manager.useActions().input({
      preferences: {
        ...manager.useContext().model.value.preferences,
        [preferenceKey(topic.id, channels[0].id)]: false
      }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    expect(
      manager.useContext().model.value.preferences[sentinelKey],
      "the sentinel should read false while one channel is off"
    ).toBe(false);

    // Now tick All-channels, exactly as the rendered control does.
    manager.useActions().input({
      preferences: {
        ...manager.useContext().model.value.preferences,
        [sentinelKey]: true
      }
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    const after = manager.useContext().model.value.preferences;
    expect(
      after[sentinelKey],
      "the All-channels control un-ticked itself after the click settled"
    ).toBe(true);
    channels.forEach(channel => {
      expect(
        after[preferenceKey(topic.id, channel.id)],
        `channel ${channel.code} was not turned on by the bulk tick`
      ).toBe(true);
    });
  });
});

describe("AC-3/AC-4 — the controlled form's own echo never undoes the click", () => {
  it("a per-channel tick survives the form re-emitting the pre-click draft", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();
    const { key } = firstWritablePair();

    const preClick = { ...manager.useContext().model.value.preferences };

    // Emit 1 — the user's click.
    manager.useActions().input({
      preferences: { ...preClick, [key]: false }
    });
    // Emit 2 — the form re-rendering from the model it was STILL showing and
    // emitting that back. Same tick, exactly as UpmForm does.
    manager.useActions().input({ preferences: preClick });

    await new Promise(resolve => setTimeout(resolve, 500));

    expect(
      manager.useContext().model.value.preferences[key],
      "the form's own echo overwrote the click — this is the tick that " +
        "deselects itself"
    ).toBe(false);
    expect(manager.useMeta().isDirty.value).toBe(true);
  });

  it("an All-channels tick survives the same echo", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();

    const topic = recorded.topics().data.find(row => row.can_opt_out);
    if (!topic) throw new Error("no opt-outable topic in the recorded capture");
    const channels = recorded.channels().data;
    const sentinelKey = preferenceKey(topic.id, "__all");

    manager.useActions().input({
      preferences: {
        ...manager.useContext().model.value.preferences,
        [preferenceKey(topic.id, channels[0].id)]: false
      }
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    const preClick = { ...manager.useContext().model.value.preferences };
    expect(preClick[sentinelKey]).toBe(false);

    manager.useActions().input({
      preferences: { ...preClick, [sentinelKey]: true }
    });
    manager.useActions().input({ preferences: preClick });

    await new Promise(resolve => setTimeout(resolve, 500));

    const after = manager.useContext().model.value.preferences;
    expect(
      after[sentinelKey],
      "the echo un-ticked All-channels — the operator's third report"
    ).toBe(true);
    channels.forEach(channel => {
      expect(after[preferenceKey(topic.id, channel.id)]).toBe(true);
    });
  });
});

describe("AC-4 — the renderer's measured two-emit bulk click", () => {
  it("survives emit 2 restating the sentinel from unchanged channels", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();

    const topic = recorded.topics().data.find(row => row.can_opt_out);
    if (!topic) throw new Error("no opt-outable topic in the recorded capture");
    const channels = recorded.channels().data;
    const sentinelKey = preferenceKey(topic.id, "__all");
    const firstKey = preferenceKey(topic.id, channels[0].id);

    // Put one channel off so the bulk tick is a real transition.
    manager.useActions().input({
      preferences: {
        ...manager.useContext().model.value.preferences,
        [firstKey]: false
      }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    const settled = { ...manager.useContext().model.value.preferences };
    expect(settled[sentinelKey]).toBe(false);

    // The EXACT pair the live renderer emits, captured from a real click:
    // emit 0 flips the sentinel; emit 1 restates it from channels that never
    // moved. Only the sentinel key differs between them.
    manager.useActions().input({
      preferences: { ...settled, [sentinelKey]: true }
    });
    manager.useActions().input({
      preferences: { ...settled, [sentinelKey]: false }
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    const after = manager.useContext().model.value.preferences;
    channels.forEach(channel => {
      expect(
        after[preferenceKey(topic.id, channel.id)],
        `channel ${channel.code} lost the bulk tick to emit 2`
      ).toBe(true);
    });
    expect(
      after[sentinelKey],
      "All-channels un-ticked itself — the operator's screenshot"
    ).toBe(true);
  });
});

describe("AC-4 — emit 2 carries STALE channels and must not revert the expansion", () => {
  it("survives the renderer's measured second emit: sentinel already settled, channels unmoved", async () => {
    installNotificationsReadWriteHandlers(server);
    const manager = await openManager();

    const topic = recorded.topics().data.find(row => row.can_opt_out);
    if (!topic) throw new Error("no opt-outable topic in the recorded capture");
    const channels = recorded.channels().data;
    const sentinelKey = preferenceKey(topic.id, "__all");

    // Turn both channels off so the bulk tick is a real transition.
    manager.useActions().input({
      preferences: {
        ...manager.useContext().model.value.preferences,
        ...Object.fromEntries(
          channels.map(c => [preferenceKey(topic.id, c.id), false])
        )
      }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    const settled = { ...manager.useContext().model.value.preferences };
    expect(settled[sentinelKey]).toBe(false);

    // The EXACT pair the live renderer produces, read off the browser
    // console: emit 1 flips the sentinel (prev false -> next true, expansion
    // fires); emit 2 arrives with the sentinel ALREADY true — so no
    // expansion runs — while still carrying the pre-expansion channels.
    manager.useActions().input({
      preferences: { ...settled, [sentinelKey]: true }
    });
    manager.useActions().input({
      preferences: { ...settled, [sentinelKey]: true }
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    const after = manager.useContext().model.value.preferences;
    channels.forEach(channel => {
      expect(
        after[preferenceKey(topic.id, channel.id)],
        `channel ${channel.code} was reverted by emit 2's stale value`
      ).toBe(true);
    });
    expect(
      after[sentinelKey],
      "All-channels un-ticked itself once emit 2 landed"
    ).toBe(true);
  });
});

// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications — the narrowed editor's title
 *
 * ## Job To Be Done
 * The preferences editor is ONE draft over every topic. When a row's edit
 * narrows it to the clicked topic, the dialog title must NAME that topic —
 * `Update <topic>` — so an operator editing one topic among many can tell which,
 * rather than reading the generic add-or-update the whole draft carries.
 *
 * ## What Breaks If These Fail
 * The narrowed editor titles itself the generic pluralised add-or-update — or
 * `Update undefined` — and the operator editing one topic cannot tell which.
 *
 * The page is booted LIVE against the module's OWN recorded corpus, through the
 * same integration kit `forced-surface.harness.ts` uses; the topic whose name
 * the title must echo is the corpus's own, never authored here. Two topics are
 * proven so the title is shown to TRACK the clicked row, not read a constant.
 */

import { trackedModuleOf } from "../../scenario.utils";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { computed, defineComponent, h } from "vue";
import { ScopeActorTypes } from "@upmind-automation/headless";
import {
  integrationKits,
  integrationSetups
} from "@upmind-automation/headless/testing";
import { reflect, SCOPE_ACTOR } from "@upmind-automation/scenario-harness";
import { CATALOGUES } from "../../../testing/rendered";
import { useModulePort } from "../../composables/useModulePort";
import {
  armCorpusModule,
  runtimeCorpus,
  runtimeFeature
} from "../../force/corpus";
import { createForceHandlers } from "../../force/handlers";
import { ModuleRenderer } from "../index";
import declaration from "../../../useClientNotifications/client-notifications.scenario";
import { find, get, keys, kebabCase, mapValues } from "lodash-es";
import type { VueWrapper } from "@vue/test-utils";
import type {
  FourLayerComposable,
  ResolvedHandoff,
  ScenarioAction
} from "../../scenario.types";

// happy-dom ships no `Element.animate`; the list's auto-animate throws without it.
(Element.prototype as unknown as { animate: () => unknown }).animate ??=
  () => ({
    cancel: () => undefined,
    finished: Promise.resolve(),
    addEventListener: () => undefined
  });

const settle = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));
const module = trackedModuleOf(declaration.tracks)!;

// Module scope, like `proveForcedSurface`: these bind the lane's msw lifecycle
// hooks, which only register at collection time.
const kit = (await integrationKits[module]()) as Record<string, unknown>;
const { server } = (await integrationSetups[module]()) as {
  server: { use: (...handlers: unknown[]) => void; resetHandlers: () => void };
};
await armCorpusModule(module);
const bodies = runtimeCorpus(module);
const feature = runtimeFeature(module);
const resetScopes = kit[
  find(keys(kit), key => /^reset.*Scopes?$/.test(key)) as string
] as () => void;

// The editor builds its OWN port; without `offeredActors` relayed it refuses the
// actor the list just served (`ResolvedHandoff.offeredActors`).
const handoffs: Record<string, ResolvedHandoff> = mapValues(
  declaration.handoff,
  declared => ({
    ...declared,
    useMutate: declaration.useMutate as FourLayerComposable,
    actor: ScopeActorTypes.CLIENT,
    offeredActors: declaration.actors
  })
);

const editRowValue = kebabCase(
  get(
    CATALOGUES,
    (
      find(
        get(declaration, ["presentation", "actions", "elements"], []),
        (action: ScenarioAction) => action.name === "editRow"
      ) as ScenarioAction
    ).i18n
  ) as string
);

let wrapper: VueWrapper<unknown>;

type Editor = { topic: string; title: string };

/** The dialog is teleported; dismiss it through its own Escape path, never by
 * clearing `document.body`, which strands Vue's fragment anchors mid-portal. */
async function dismissDialog(): Promise<void> {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
  );
  await settle(400);
}

async function bootLive(): Promise<{ topics: Array<{ name: string }> }> {
  resetScopes();
  server.resetHandlers();
  await (kit.seedClientSession as () => Promise<unknown>)();
  (kit.installBackgroundStubs as (target: unknown) => void)(server);
  server.use(...createForceHandlers("replay", bodies!, feature));
  (kit.installNotificationsReadWriteHandlers as (target: unknown) => void)(
    server
  );

  const port = useModulePort(declaration.useList as never, {
    actor: ScopeActorTypes.CLIENT,
    offeredActors: declaration.actors
  });
  const host = defineComponent({
    setup() {
      const descriptor = computed(() =>
        reflect(declaration.key, SCOPE_ACTOR.SELF, port)
      );
      return () =>
        h(ModuleRenderer, {
          descriptor: descriptor.value,
          port,
          presentation: declaration.presentation,
          handoffs
        });
    }
  });

  wrapper = mount(host, { attachTo: document.body });
  await Promise.race([
    (port.actions.isReady as () => Promise<unknown>)(),
    settle(20000)
  ]);
  await settle(600);

  const data = (
    (port.useContext?.() ?? {}) as {
      data?: { value?: Array<{ name: string }> };
    }
  ).data?.value;
  return { topics: data ?? [] };
}

/** Opens the row's editor, reads its title, then dismisses it. */
async function titleForRow(index: number): Promise<string | undefined> {
  const rows = wrapper.find("table").exists()
    ? wrapper.findAll("tbody tr")
    : wrapper.findAll("li");
  const opener = rows[index]?.find(`[data-test-value="${editRowValue}"]`);
  if (
    !opener?.exists() ||
    opener.attributes("disabled") !== undefined ||
    opener.attributes("aria-disabled") === "true"
  )
    return undefined;

  await opener.trigger("click");
  await settle(2000);
  const title = document.body.querySelector("h2")?.textContent?.trim() ?? "";
  await dismissDialog();

  return title;
}

afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = "";
});

// -----------------------------------------------------------------------------

describe("the narrowed editor's title", () => {
  it(
    "names the clicked topic, and tracks it from one row to the next",
    { timeout: 40000 },
    async () => {
      const { topics } = await bootLive();
      expect(topics.length).toBeGreaterThan(1);

      const editors: Editor[] = [];
      for (
        let index = 0;
        index < topics.length && editors.length < 2;
        index += 1
      ) {
        const title = await titleForRow(index);
        if (title) editors.push({ topic: topics[index]!.name, title });
      }

      expect(editors.length).toBe(2);
      for (const editor of editors)
        expect(editor.title).toBe(`Update ${editor.topic}`);
      expect(editors[0]!.title).not.toBe(editors[1]!.title);
    }
  );
});

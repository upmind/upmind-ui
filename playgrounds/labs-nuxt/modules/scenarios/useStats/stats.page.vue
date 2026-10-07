<template>
  <Page :data-attrs="{ 'data-test-key': 'stats-page' }">
    <PageHeader>
      <PageTitle>{{ t("labs.stats_title") }}</PageTitle>
      <PageDescription>
        {{ t("labs.stats_description") }}
      </PageDescription>
    </PageHeader>

    <!-- The page's OWN scenario bar. A self-drawn page mounts no
         `ScenarioPlayground`, so it mounts the standalone bar directly over the
         same transport the shared host builds (`useScenarioTransport`) — one
         wiring, two hosts. Each step boots the `stats` key at client×self, the
         SAME scope the page below renders, so the four counts redraw as the
         script plays them. -->
    <ScenarioBar
      :player="player"
      :tracks="tracks"
      :states="states"
      class="mb-4"
    />

    <PageBody class="gap-10">
      <!--
        `StatGroup`'s DEFAULT slot, not its `:stats` prop. The prop path renders
        a `Stat` per `StatItem`, and `StatItem` carries no per-cell test
        attributes — so the four `data-test-key` wrappers AC-12's read-back
        selects on would have nowhere to live. The default slot is the
        documented escape for hand-authored cells, and it keeps the wrapper and
        its `data-test-value` under this page's control.
      -->
      <StatGroup :columns="4">
        <div
          data-test-key="total-orders"
          :data-test-value="data.totalOrders ?? ''"
        >
          <Stat
            :label="t('labs.stats_total_orders')"
            :value="data.totalOrders ?? '--'"
          />
        </div>
        <div
          data-test-key="total-invoices"
          :data-test-value="data.totalInvoices ?? ''"
        >
          <Stat
            :label="t('labs.stats_total_invoices')"
            :value="data.totalInvoices ?? '--'"
          />
        </div>
        <div
          data-test-key="unpaid-invoices"
          :data-test-value="data.unpaidInvoices ?? ''"
        >
          <Stat
            :label="t('labs.stats_unpaid_invoices')"
            :value="data.unpaidInvoices ?? '--'"
          />
        </div>
        <div
          v-if="isVisible"
          data-test-key="active-tickets"
          :data-test-value="data.activeTickets ?? ''"
        >
          <Stat
            :label="t('labs.stats_active_tickets')"
            :value="data.activeTickets ?? '--'"
          />
        </div>
      </StatGroup>
    </PageBody>
  </Page>
</template>

<script lang="ts" setup>
/**
 * @module scenarios/useStats/stats.page
 * @description The ONE client-dashboard-stats route — `/useStats`. It renders
 * the four counts straight off `useStats().useContext().data`, each tagged
 * with a `data-test-value` so AC12's read-back reads the counts off the
 * rendered markup, never off translated text (design 5.1). The active-tickets
 * tile respects `useMeta().isVisible`, the support-system brand gate (AC7) —
 * the oracle's own visibility rule for that tile.
 *
 * The Upmind-usage block is NOT drawn here (operator ruling, 2026-10-03): the
 * labs page shows the four counts only. The usage read and its AC-13/AC-14
 * capability scenarios stay in the headless module, untouched.
 */

// Explicit, not auto-imported: components are NOT auto-registered under
// `modules/scenarios/`. Every sibling page imports its own, and a missing
// import renders nothing in the browser while a component test still passes.
import {
  Page,
  PageBody,
  PageDescription,
  PageHeader,
  PageTitle,
  Stat,
  StatGroup
} from "@upmind/ui";
import { onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { resolveSelfActor, useStats } from "@upmind-automation/headless";
import ScenarioBar from "../runtime/components/ScenarioBar.vue";
import { useScenarioTransport } from "../runtime/composables/useScenarioTransport";
import { useScenarioWorld } from "../runtime/composables/useScenarioWorld";
import { registry } from "../runtime/registry";
import scenario, { STATS_SCENARIO } from "./stats.scenario";
import type { ScopeActor } from "@upmind-automation/scenario-harness";
import { useActorScope } from "~/composables/scope";

// NO `name`, `path` or `nav` here: the registrar owns all three, off the
// declaration beside this file.
definePageMeta({
  key: route => route.fullPath
});

/**
 * LOCAL messages, not the app plugin's. Every rendered string on a playground
 * page must be a `t()` key — the `playground-vocabulary` audit fails a bare
 * English text node. But the labs i18n plugin ships `messages: {}`, so a key
 * with nowhere to resolve renders as its own name, and the tiles would read
 * "labs.stats_total_orders" instead of "Total orders".
 *
 * A local scope satisfies both: the template holds keys, and the keys resolve
 * here rather than in a shared plugin this one page has no business editing.
 */
const { t } = useI18n({
  useScope: "local",
  messages: {
    en: {
      labs: {
        stats_title: "Client dashboard stats",
        stats_description:
          "The four client self-service dashboard counts, read from GET api/stats.",
        stats_total_orders: "Total orders",
        stats_total_invoices: "Total invoices",
        stats_unpaid_invoices: "Unpaid invoices",
        stats_active_tickets: "Active tickets"
      }
    }
  }
});

const stats = useStats().as("client");
const { data } = stats.useContext();
const { isVisible } = stats.useMeta();
const { reset } = stats.useActions();

// The page's OWN transport. `useManage` on the declaration gives the harness a
// boot thunk for the `stats` key; `useScenarioWorld` is told the page HOSTS
// that key, so a step's boot adopts the cell above (the scope registry hands
// back the same client×self instance) instead of booting — and never destroys
// — a second one. `reset` is the module's own cache clear a forced state arms.
const actorScope = useActorScope();

const world = useScenarioWorld(registry, { key: STATS_SCENARIO });

const { tracks, states, player } = useScenarioTransport({
  module: scenario.tracks,
  reset,
  world,
  scope: () => ({ actor: resolveSelfActor(actorScope.value) as ScopeActor })
});

onUnmounted(() => void world.dispose());
</script>

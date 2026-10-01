<template>
  <div data-test-key="invoice-page">
    <ScenarioBar
      :player="player"
      :tracks="tracks"
      :states="states"
      class="mb-4"
    />

    <Card v-if="!subjectId" size="sm" class="gap-4">
      <EmptyState
        :title="t('labs.invoice_needs_id')"
        :description="t('labs.invoice_needs_id_text')"
      >
        <template #icon><Icon icon="receipt" /></template>
      </EmptyState>
      <div v-if="pickerForm" class="w-full" data-test-key="invoice-lookup">
        <Form
          :schema="pickerForm.schema"
          :uischema="pickerForm.uischema"
          :model-value="pickerModel"
          :additional-renderers="formRenderers"
          no-actions
          size="sm"
          @update:model-value="onInvoicePick"
        />
      </div>

      <div class="mt-4 flex items-end gap-3">
        <Input
          v-model="idInput"
          :placeholder="t('labs.invoice_id_label')"
          :data-attrs="{ 'data-test-key': 'invoice-id-input' }"
          @keyup.enter="openInvoice"
        />
        <Button
          :disabled="!idInput.trim() || resolving"
          :loading="resolving"
          :data-attrs="{ 'data-test-key': 'invoice-open' }"
          @click="openInvoice"
        >
          {{ t("labs.invoice_open") }}
        </Button>
      </div>

      <Alert
        v-if="notFoundReference"
        variant="warning"
        appearance="outline"
        :title="t('labs.invoice_not_found')"
        :description="
          t('labs.invoice_not_found_text', { reference: notFoundReference })
        "
        :data-attrs="{ 'data-test-key': 'invoice-not-found' }"
      />
    </Card>

    <Suspense v-else>
      <OrderView :key="subjectId" :invoice-id="subjectId" />
      <template #fallback>
        <div class="flex justify-center p-8">
          <Spinner :label="t('text.loading')" />
        </div>
      </template>
    </Suspense>
  </div>
</template>

<script lang="ts" setup>
/**
 * @module scenarios/useInvoice/invoice.page
 * @description The ONE order/invoice route — `/useInvoice/:oid`. It renders the
 * rich `OrderView` (a labs copy of `UpmOrder` with the pay CONTROLS removed): the
 * hero, the order status, the line items and summary, plus a Pay button. Paying
 * happens in the `?init=pay` pay modal (`overlay-payment`, `useInvoice`), never
 * on this page. The page mounts its own `ScenarioBar` over the module's
 * `@detail` playlist (the `useTicket` precedent): while a track is armed it
 * draws the invoice that track's recording booted, else the route's.
 */

import { Alert, Button, Card, EmptyState, Input, Spinner } from "@upmind/ui";
import { computed, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import {
  formRenderers,
  resolveSelfActor,
  ScopeActorTypes,
  useInvoices
} from "@upmind-automation/client-vue";
import { Form, Icon } from "@upmind-automation/foundation";
import ScenarioBar from "../runtime/components/ScenarioBar.vue";
import { useScenarioTransport } from "../runtime/composables/useScenarioTransport";
import { useScenarioWorld } from "../runtime/composables/useScenarioWorld";
import { registry } from "../runtime/registry";
import scenario, { INVOICE_SCENARIO } from "./invoice.scenario";
import { isArray } from "lodash-es";
import type { ScopeActor, World } from "@upmind-automation/scenario-harness";
import OrderView from "~/components/OrderView.vue";
import { useActorScope } from "~/composables/scope";

// Keyed by path, not fullPath: the transport writes track/scene into the query,
// which must not remount the page.
definePageMeta({
  key: route => route.path
});

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const routeId = computed(() => {
  const raw = route.params.oid;
  const id = isArray(raw) ? raw[0] : raw;
  return id || undefined;
});

// .fresh() so the finder's search never disturbs a live listing scope.
const picker = routeId.value
  ? undefined
  : useInvoices().as(ScopeActorTypes.SELF).fresh();

const pickerForm = picker?.useContext().schemas.invoicePicker;

/** The picked id, held so the control draws its own selection back. */
const pickerModel = ref<{ invoice?: string | null }>({});

function onInvoicePick(next: { invoice?: string | null } | undefined): void {
  const picked = next?.invoice;
  pickerModel.value = { invoice: picked };
  if (picked) router.push(`/useInvoice/${picked}`);
}

onUnmounted(() => picker?.useActions().destroy());

// Loose hex, not RFC-4122: real ids carry non-standard version/variant nibbles.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const idInput = ref("");
const resolving = ref(false);
const notFoundReference = ref<string>();

watch(idInput, () => {
  notFoundReference.value = undefined;
});

function resolveReferenceToId(reference: string): Promise<string | undefined> {
  const invoices = useInvoices().as(ScopeActorTypes.SELF).fresh();
  const collection = invoices.useActions();
  collection.setCriteria({ filters: { number: reference } });
  return collection
    .isReady()
    .then(() => invoices.useContext().data.value[0]?.id)
    .finally(() => collection.destroy());
}

async function openInvoice(): Promise<void> {
  const input = idInput.value.trim();
  if (!input || resolving.value) return;

  if (UUID_PATTERN.test(input)) {
    router.push(`/useInvoice/${input}`);
    return;
  }

  resolving.value = true;
  notFoundReference.value = undefined;
  return resolveReferenceToId(input)
    .then(id => {
      if (!id) {
        notFoundReference.value = input;
        return;
      }
      router.push(`/useInvoice/${id}`);
    })
    .finally(() => {
      resolving.value = false;
    });
}

/** The invoice the armed track's own recording booted; absent on Live. */
const replayId = ref<string>();

const subjectId = computed(() => replayId.value ?? routeId.value);

const actorScope = useActorScope();

const hostWorld = useScenarioWorld(registry, {
  key: INVOICE_SCENARIO,
  id: routeId.value
});

const world: World = {
  ...hostWorld,
  async boot(key, scope) {
    await hostWorld.boot(key, scope);
    if (key === INVOICE_SCENARIO && scope.id) replayId.value = scope.id;
  }
};

const { tracks, states, player } = useScenarioTransport({
  module: scenario.tracks,
  world,
  scope: () => ({ actor: resolveSelfActor(actorScope.value) as ScopeActor })
});

watch(
  () => player.track.value,
  () => {
    replayId.value = undefined;
    void world.dispose();
  },
  { flush: "sync" }
);

onUnmounted(() => {
  void world.dispose();
});
</script>

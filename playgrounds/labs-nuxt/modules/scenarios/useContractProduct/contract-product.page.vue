<template>
  <Page :data-attrs="{ 'data-test-key': 'contract-product-page' }">
    <PageHeader>
      <PageTitle>{{ t("labs.contract_product_title") }}</PageTitle>
      <PageDescription>
        {{ t("labs.contract_product_description") }}
      </PageDescription>
    </PageHeader>

    <ScenarioBar
      :player="player"
      :tracks="tracks"
      :states="states"
      class="mb-4"
    />

    <PageBody class="relative gap-8">
      <!-- No product in the url — FIND one. -->
      <Card v-if="!subjectId" size="sm" class="gap-4">
        <EmptyState
          :title="t('labs.contract_product_needs_id')"
          :description="t('labs.contract_product_needs_id_text')"
        >
          <template #icon><Icon icon="box" /></template>
        </EmptyState>

        <!-- FIND a product. The collection's OWN lookups pair, its control
             already bound to this scope's service (`schemas.contractProductPicker`)
             — the same shape `useTicket` renders for `schemas.ticketPicker`. The
             pick IS the write: selecting a row writes the product's id, and this
             page navigates to it. -->
        <div
          v-if="pickerForm"
          class="w-full"
          data-test-key="contract-product-lookup"
        >
          <Form
            :schema="pickerForm.schema"
            :uischema="pickerForm.uischema"
            :model-value="pickerModel"
            :additional-renderers="formRenderers"
            no-actions
            size="sm"
            @update:model-value="onContractProductPick"
          />
        </div>

        <!-- ...or address one directly, for an id pasted from a url. -->
        <div class="mt-4 flex items-end gap-3">
          <Input
            v-model="idInput"
            :placeholder="t('labs.contract_product_id_label')"
            :data-attrs="{ 'data-test-key': 'contract-product-id-input' }"
            @keyup.enter="openProduct"
          />
          <Button
            :disabled="!idInput.trim()"
            :data-attrs="{ 'data-test-key': 'contract-product-open' }"
            @click="openProduct"
          >
            {{ t("labs.contract_product_open") }}
          </Button>
        </div>
      </Card>

      <!-- Booting the addressed product, or re-reading it (a write, a
           refresh or a reset all pass back through the machine's `loading`
           node, which clears `contractProduct` on entry). -->
      <div
        v-else-if="booting || meta?.isLoading.value"
        class="flex justify-center p-8"
      >
        <Spinner :label="t('text.loading')" />
      </div>

      <!-- The read failed for this session — the manager's own error, as state. -->
      <Alert
        v-else-if="!isReadable"
        variant="danger"
        appearance="outline"
        :title="t('labs.contract_product_unavailable')"
        :description="readError || t('labs.contract_product_unavailable_text')"
        :data-attrs="{ 'data-test-key': 'contract-product-unavailable' }"
      />

      <template v-else>
        <!-- Meta: the record's identity, its per-record flags and facts. -->
        <Card size="sm" class="gap-4">
          <div class="flex flex-wrap items-center gap-3">
            <span
              class="text-lg font-semibold"
              data-test-key="contract-product-name"
            >
              {{ contractProduct?.name }}
            </span>
            <StatusBadge
              size="sm"
              tone="neutral"
              data-test-key="contract-product-status"
            >
              {{ contractProduct?.status?.name }}
            </StatusBadge>
            <Badge
              v-for="flag in nodeFlags"
              :key="flag.key"
              size="sm"
              appearance="muted"
              :data-test-key="`contract-product-meta-${flag.key}`"
            >
              {{ flag.label }}
            </Badge>
          </div>

          <p
            v-if="description"
            class="text-faint text-sm"
            data-test-key="contract-product-description"
          >
            {{ description }}
          </p>

          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt class="text-faint">{{ t("text.price") }}</dt>
              <dd data-test-key="contract-product-price">
                {{ contractProduct?.priceFormatted }}
              </dd>
            </div>
            <div>
              <dt class="text-faint">{{ t("text.billing_cycle") }}</dt>
              <dd>{{ contractProduct?.billingCycle }}</dd>
            </div>
            <div>
              <dt class="text-faint">{{ t("text.purchase_date") }}</dt>
              <dd data-test-key="contract-product-created-at">
                {{ contractProduct?.dateCreated?.date }}
              </dd>
            </div>
            <div>
              <dt class="text-faint">{{ t("text.next_due_date") }}</dt>
              <dd data-test-key="contract-product-next-due-date">
                {{ contractProduct?.dateNextDue?.date }}
              </dd>
            </div>
            <div v-if="futureCancellationDate">
              <dt class="text-faint">
                {{ t("labs.contract_product_future_cancellation_date") }}
              </dt>
              <dd data-test-key="contract-product-future-cancellation-date">
                {{ futureCancellationDate }}
              </dd>
            </div>
            <div v-if="minFutureCancellationDate">
              <dt class="text-faint">
                {{ t("labs.contract_product_min_future_cancellation_date") }}
              </dt>
              <dd>{{ minFutureCancellationDate }}</dd>
            </div>
            <div v-if="contractProduct?.dateCalculatedCancel?.date">
              <dt class="text-faint">
                {{ t("labs.contract_product_calculated_cancel_date") }}
              </dt>
              <dd data-test-key="contract-product-calculated-cancel-date">
                {{ contractProduct.dateCalculatedCancel.date }}
              </dd>
            </div>
          </dl>

          <div v-if="scheduledActions.length" class="flex flex-col gap-1">
            <span class="text-faint text-sm">
              {{ t("labs.contract_product_scheduled_actions") }}
            </span>
            <ul
              class="flex flex-col gap-1 text-sm"
              data-test-key="contract-product-scheduled-actions"
            >
              <li v-for="action in scheduledActions" :key="action.id">
                {{ action.action_code }} — {{ action.status?.code }}
              </li>
            </ul>
          </div>

          <Badge
            v-if="meta?.hasUnpaidRecurringInvoices.value"
            size="sm"
            appearance="muted"
            data-test-key="contract-product-unpaid-invoices"
          >
            {{ t("labs.contract_product_unpaid_invoices") }}
          </Badge>

          <!-- Formless writes, one row. Each is drawn in every state and
               disabled where the state does not allow it, as useTicket does. -->
          <div class="flex flex-wrap gap-3 pt-2">
            <Button
              variant="outline"
              :disabled="
                !meta?.isCancelling.value || pending || meta?.isProcessing.value
              "
              :data-attrs="{ 'data-test-key': 'contract-product-withdraw' }"
              @click="withdraw"
            >
              {{ t("labs.contract_product_withdraw") }}
            </Button>
            <Button
              variant="outline"
              :disabled="
                !meta?.isExpiring.value || pending || meta?.isProcessing.value
              "
              :data-attrs="{ 'data-test-key': 'contract-product-resume' }"
              @click="resume"
            >
              {{ t("labs.contract_product_resume") }}
            </Button>
            <Button
              variant="outline"
              :disabled="
                !meta?.hasScheduledFutureCancellation.value ||
                pending ||
                meta?.isProcessing.value
              "
              :data-attrs="{
                'data-test-key': 'contract-product-revoke-scheduled'
              }"
              @click="revokeScheduled"
            >
              {{ t("labs.contract_product_revoke_scheduled") }}
            </Button>
            <Button
              variant="ghost"
              :disabled="pending || meta?.isProcessing.value"
              :data-attrs="{ 'data-test-key': 'contract-product-refresh' }"
              @click="refresh"
            >
              {{ t("action.refresh") }}
            </Button>
            <Button
              variant="ghost"
              :disabled="pending || meta?.isProcessing.value"
              :data-attrs="{ 'data-test-key': 'contract-product-reset' }"
              @click="reset"
            >
              {{ t("labs.contract_product_reset") }}
            </Button>
          </div>
        </Card>

        <Alert
          v-if="actionError"
          variant="danger"
          appearance="muted"
          :title="actionError"
          :data-attrs="{ 'data-test-key': 'contract-product-action-error' }"
        />

        <!-- Direct writes — each opens, sets and submits its form in one call,
             so they are offered only while neither form is open. -->
        <Card
          size="sm"
          class="gap-4"
          data-test-key="contract-product-direct-writes"
        >
          <span class="font-medium">
            {{ t("labs.contract_product_direct_writes") }}
          </span>

          <label class="flex flex-col gap-1">
            <span class="text-faint text-sm">
              {{ t("labs.contract_product_reason_label") }}
            </span>
            <Input
              v-model="reasonDraft"
              :disabled="pending || meta?.isProcessing.value"
              :data-attrs="{ 'data-test-key': 'contract-product-reason-input' }"
            />
          </label>

          <div class="flex flex-wrap items-end gap-3">
            <Button
              variant="outline"
              :disabled="
                !meta?.hasCancellationOptions.value ||
                meta?.isCancellationOpen.value ||
                meta?.isConsolidationOpen.value ||
                pending ||
                meta?.isProcessing.value
              "
              :data-attrs="{
                'data-test-key': 'contract-product-stop-renewing'
              }"
              @click="stopRenewing"
            >
              {{ t("labs.contract_product_stop_renewing") }}
            </Button>
          </div>

          <div class="flex flex-wrap items-end gap-3">
            <label class="flex-1">
              <span class="text-faint text-sm">
                {{ t("labs.contract_product_schedule_date_label") }}
              </span>
              <Input
                v-model="scheduleDate"
                type="date"
                :min="minFutureCancellationDate ?? undefined"
                :disabled="pending || meta?.isProcessing.value"
                :data-attrs="{
                  'data-test-key': 'contract-product-schedule-date'
                }"
              />
            </label>
            <Button
              variant="outline"
              :disabled="
                !scheduleDate.trim() ||
                !meta?.canScheduleFutureCancellation.value ||
                !meta?.hasCancellationOptions.value ||
                meta?.isCancellationOpen.value ||
                meta?.isConsolidationOpen.value ||
                pending ||
                meta?.isProcessing.value
              "
              :data-attrs="{
                'data-test-key': 'contract-product-schedule-cancellation'
              }"
              @click="scheduleCancellation"
            >
              {{ t("labs.contract_product_schedule_cancellation") }}
            </Button>
          </div>

          <div class="flex flex-wrap gap-3">
            <Button
              v-for="choice in consolidationChoices"
              :key="choice.key"
              variant="outline"
              :disabled="
                !meta?.canConsolidate.value ||
                meta?.isCancellationOpen.value ||
                meta?.isConsolidationOpen.value ||
                pending ||
                meta?.isProcessing.value
              "
              :data-attrs="{
                'data-test-key': `contract-product-set-consolidation-${choice.key}`
              }"
              @click="setConsolidation(choice.value)"
            >
              {{ choice.label }}
            </Button>
          </div>
        </Card>

        <!-- Cancellation — the ONE combined form (R33). No dialog opens empty:
             it renders only while the machine has filled `context.cancellation`
             (its own open transition builds the schema/uischema/model). -->
        <Card size="sm" class="gap-4">
          <div class="flex items-center justify-between">
            <span class="font-medium">
              {{ t("labs.contract_product_cancellation") }}
            </span>
            <Button
              v-if="!meta?.isCancellationOpen.value"
              variant="outline"
              :disabled="
                !meta?.hasCancellationOptions.value ||
                meta?.isConsolidationOpen.value ||
                pending ||
                meta?.isProcessing.value
              "
              :data-attrs="{
                'data-test-key': 'contract-product-cancellation-open'
              }"
              @click="openCancellation"
            >
              {{ t("labs.contract_product_cancellation_open") }}
            </Button>
          </div>

          <div
            v-if="cancellationForm"
            class="flex flex-col gap-3"
            data-test-key="contract-product-cancellation-form"
          >
            <Form
              :schema="cancellationForm.schema"
              :uischema="cancellationForm.uischema"
              :model-value="cancellationForm.model"
              :additional-renderers="formRenderers"
              :additional-errors="validationErrors"
              :disabled="pending || meta?.isProcessing.value"
              no-actions
              size="sm"
              @update:model-value="onCancellationModelUpdate"
            />
            <div class="flex justify-end gap-3">
              <Button
                variant="ghost"
                :disabled="pending || meta?.isProcessing.value"
                :data-attrs="{
                  'data-test-key': 'contract-product-cancellation-cancel'
                }"
                @click="closeCancellation"
              >
                {{ t("action.cancel") }}
              </Button>
              <Button
                :disabled="
                  !meta?.isCancellationValid.value ||
                  pending ||
                  meta?.isProcessing.value
                "
                :data-attrs="{
                  'data-test-key': 'contract-product-cancellation-submit'
                }"
                @click="submitCancellation"
              >
                {{ t("labs.contract_product_cancellation_submit") }}
              </Button>
            </div>
          </div>

          <EmptyState
            v-else-if="!meta?.hasCancellationOptions.value"
            :title="t('labs.contract_product_cancellation_unavailable')"
          >
            <template #icon><Icon icon="box" /></template>
          </EmptyState>
        </Card>

        <!-- Consolidation — the invoice-consolidation opt-in/out. -->
        <Card size="sm" class="gap-4">
          <div class="flex items-center justify-between">
            <span class="font-medium">
              {{ t("labs.contract_product_consolidation") }}
            </span>
            <Button
              v-if="!meta?.isConsolidationOpen.value"
              variant="outline"
              :disabled="
                !meta?.canConsolidate.value ||
                meta?.isCancellationOpen.value ||
                pending ||
                meta?.isProcessing.value
              "
              :data-attrs="{
                'data-test-key': 'contract-product-consolidation-open'
              }"
              @click="openConsolidation"
            >
              {{ t("labs.contract_product_consolidation_open") }}
            </Button>
          </div>

          <div
            v-if="consolidationForm"
            class="flex flex-col gap-3"
            data-test-key="contract-product-consolidation-form"
          >
            <Form
              :schema="consolidationForm.schema"
              :uischema="consolidationForm.uischema"
              :model-value="consolidationForm.model"
              :additional-renderers="formRenderers"
              :additional-errors="validationErrors"
              :disabled="pending || meta?.isProcessing.value"
              no-actions
              size="sm"
              @update:model-value="onConsolidationModelUpdate"
            />
            <div class="flex justify-end gap-3">
              <Button
                variant="ghost"
                :disabled="pending || meta?.isProcessing.value"
                :data-attrs="{
                  'data-test-key': 'contract-product-consolidation-cancel'
                }"
                @click="closeConsolidation"
              >
                {{ t("action.cancel") }}
              </Button>
              <Button
                :disabled="
                  !meta?.isConsolidationValid.value ||
                  pending ||
                  meta?.isProcessing.value
                "
                :data-attrs="{
                  'data-test-key': 'contract-product-consolidation-submit'
                }"
                @click="submitConsolidation"
              >
                {{ t("labs.contract_product_consolidation_submit") }}
              </Button>
            </div>
          </div>

          <EmptyState
            v-else-if="!meta?.canConsolidate.value"
            :title="t('labs.contract_product_consolidation_unavailable')"
          >
            <template #icon><Icon icon="box" /></template>
          </EmptyState>
        </Card>
      </template>

      <!-- While a scenario plays or a forced state is armed, the page content
           is the SCRIPT's — see `ticket.page.vue` for the full rationale. -->
      <div
        v-if="isLocked"
        :class="scenarioPlayground.scrim()"
        :title="t('labs.replay_locked')"
        aria-hidden="true"
        data-test-key="replay-scrim"
      />
    </PageBody>
  </Page>
</template>

<script lang="ts" setup>
/**
 * @module scenarios/useContractProduct/contract-product.page
 * @description The client×self contract-product MANAGER, drawn directly. It
 * boots `useContractProduct().as(ScopeActorTypes.CLIENT).withId(id)`
 * (`CONTRACT_PRODUCT_SCOPE_MATRIX` refuses every `.for()` context) from the id
 * the route param carries, and drives the manager's own members: the
 * combined cancellation form (`openCancellation`/`set`/`submitCancellation`/
 * `cancelForm`, R33 — soft/hard/schedule_future, reason, custom fields, the
 * date floor `minFutureCancellationDate`), the consolidation form (the same
 * shape), the direct writes (`stopRenewing`, `scheduleCancellation`,
 * `setConsolidation` — open, set and submit in one call), the formless writes
 * (`withdrawCancellation`, `resumeRenewing`, `revokeScheduledCancellation`),
 * `refresh` and the force handle `reset`.
 *
 * Both forms render from their OWN context slot
 * (`useContext().cancellation` / `.consolidation` = `{ schema, uischema,
 * model }`), which the machine fills on that form's open transition — no
 * dialog opens empty. The two share ONE validation-error slot
 * (`useContext().validationErrors`, D71), so each form's OWN "open" control
 * hides while the OTHER form is open — the page draws one form at a time,
 * which is what keeps the shared slot correct. Submit is gated on
 * `useMeta().isCancellationValid` / `isConsolidationValid`; an invalid model
 * shows `useContext().validationErrors` on the form. `submitCancellation`
 * resolves `false` when the model carries no
 * option; `submitConsolidation` resolves `false` when the model carries no
 * `invoiceConsolidationEnabled`. Either submit REJECTS when the model has its
 * option but fails validation (the node's `.checking` refusal, a 422) — this
 * page wraps both calls in `run()`, which catches the rejection and reports it
 * as `actionError`.
 *
 * NOT drawn, and named rather than faked:
 *
 * - `requestCancellation` is the direct HARD request; the cancellation form's
 *   `hard` option drives the same write, and no scenario fires it.
 * - `isReady`/`onDone`/`stop`/`destroy` are lifecycle, not user capability.
 *
 * ## Which product a replay shows
 * Every manager step boots the product ITS OWN recording addressed
 * (`.withId(id)`), and that id wins over the url's: while a track is armed the
 * page draws the cell the step booted — the same registry instance, so each
 * fired action moves what is on screen. A new track, or Live, hands the page
 * back to the url's product and releases every cell the replay opened.
 *
 * No forced-surface spec is owed: a self-drawing page carries none, exactly
 * as `useTicket` does.
 *
 * `nodeFlags` draws all thirteen reportable node flags plus three record
 * facts (`isDelegatedAccess`, `isImported`, `hasMoved`) that read alongside
 * them; busy state binds to `useMeta().isProcessing` alongside the local
 * `pending` this page's own `run()` wrapper sets.
 */

import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Page,
  PageBody,
  PageDescription,
  PageHeader,
  PageTitle,
  Spinner,
  StatusBadge
} from "@upmind/ui";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  ContractProductFormTypes,
  formRenderers,
  ScopeActorTypes,
  resolveSelfActor,
  useContractProduct,
  useContractProducts
} from "@upmind-automation/client-vue";
import { Form, Icon } from "@upmind-automation/foundation";
import { InvoiceConsolidationTypes } from "@upmind-automation/types";
import ScenarioBar from "../runtime/components/ScenarioBar.vue";
import { useScenarioTransport } from "../runtime/composables/useScenarioTransport";
import { useScenarioWorld } from "../runtime/composables/useScenarioWorld";
import { registry } from "../runtime/registry";
import { scenarioPlayground } from "../runtime/ScenarioPlayground.styles";
import scenario, {
  CONTRACT_PRODUCT_SCENARIO
} from "./contract-product.scenario";
import { filter, isArray } from "lodash-es";
import type {
  CancellationModel,
  SetConsolidationModel
} from "@upmind-automation/client-vue";
import type { ScopeActor, World } from "@upmind-automation/scenario-harness";
import { useActorScope } from "~/composables/scope";

// NO `name`, `path` or `nav` here: the registrar owns all three, off the
// declaration beside this file.
//
// Keyed by PATH, never `fullPath`: the product id is a ROUTE PARAM
// (`/useContractProduct/<id>`), so the path alone already remounts a fresh
// manager for a different product — while the QUERY, which the scenario
// transport writes `track=`, `scene=` and `force=` into, must not.
definePageMeta({
  key: route => route.path
});

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

/** The product this page reads — its own declared route param, never a scope context. */
const productId = computed(() => {
  const raw = route.params.id;
  const id = isArray(raw) ? raw[0] : raw;
  return id || undefined;
});

/** The product the armed track's own recording booted; absent on Live. */
const replayId = ref<string>();

/** The product on screen — the replay's while a track is armed, else the url's. */
const subjectId = computed(() => replayId.value ?? productId.value);

// CLIENT is the only actor the manager resolves; the matrix refuses every
// actor a `.for()` context, so `.as()` is the whole address.
const openCell = (id: string) =>
  useContractProduct().as(ScopeActorTypes.CLIENT).withId(id);

/** Every cell this page has drawn, so each is destroyed exactly once. */
const cells = new Map<string, ReturnType<typeof openCell>>();

function cellFor(id: string): ReturnType<typeof openCell> {
  const cell = cells.get(id) ?? openCell(id);
  cells.set(id, cell);
  return cell;
}

function release(keep?: string): void {
  for (const [id, cell] of cells) {
    if (id === keep) continue;
    cell.useActions().destroy();
    cells.delete(id);
  }
}

if (productId.value) cellFor(productId.value);

const manager = computed(() =>
  subjectId.value ? cellFor(subjectId.value) : undefined
);

const actions = computed(() => manager.value?.useActions());
const context = computed(() => manager.value?.useContext());
const meta = computed(() => manager.value?.useMeta());

// --- The page's own scenario transport (mirrors `ticket.page.vue`)
const actorScope = useActorScope();

const hostWorld = useScenarioWorld(registry, {
  key: CONTRACT_PRODUCT_SCENARIO,
  id: productId.value
});

/** The host world, reporting each product a step boots so the page draws it. */
const world: World = {
  ...hostWorld,
  async boot(key, scope) {
    await hostWorld.boot(key, scope);
    if (key === CONTRACT_PRODUCT_SCENARIO && scope.id)
      replayId.value = scope.id;
  }
};

const { tracks, states, player, isLocked } = useScenarioTransport({
  module: scenario.tracks,
  world,
  scope: () => ({ actor: resolveSelfActor(actorScope.value) as ScopeActor }),
  reset: () => actions.value?.reset()
});

// Sync, so the release lands before the new track's first scene can boot; the
// world is disposed BEFORE the cells go, so it never adopts one released here.
watch(
  () => player.track.value,
  () => {
    replayId.value = undefined;
    void world.dispose();
    release(productId.value);
  },
  { flush: "sync" }
);

const contractProduct = computed(() => context.value?.contractProduct.value);
const description = computed(() => context.value?.description.value);
const readError = computed(() => context.value?.error.value?.message);
const validationErrors = computed(() => context.value?.validationErrors.value);
const scheduledActions = computed(
  () => context.value?.scheduledActions.value ?? []
);
const minFutureCancellationDate = computed(
  () => context.value?.minFutureCancellationDate.value
);
const futureCancellationDate = computed(
  () =>
    contractProduct.value?.futureCancellationRequest?.future_cancellation_date
);
const cancellationForm = computed(() => context.value?.cancellation.value);
const consolidationForm = computed(() => context.value?.consolidation.value);

const booting = ref(true);
const pending = ref(false);
const actionError = ref<string>();
const idInput = ref("");

/**
 * The picker's own collection instance, booted ONLY while no product is
 * addressed — once one is, this card is gone. `.fresh()` so a finder search
 * never disturbs a live listing scope, mirroring `useTicket`. It publishes the
 * pair rather than a list: `schemas.contractProductPicker` carries the control
 * with its service already bound, so this page renders a form and reaches no
 * service itself.
 */
const picker = productId.value
  ? undefined
  : useContractProducts().as(ScopeActorTypes.CLIENT).fresh();

const pickerForm = picker?.useContext().schemas.contractProductPicker;

/** The picked id, held so the control draws its own selection back. */
const pickerModel = ref<{ contractProduct?: string | null }>({});

onUnmounted(() => picker?.useActions().destroy());

/**
 * A pick is a navigation. The lookup writes the product's id — the option's
 * `value` (`mapContractProductPickerItem`) and what the manager loads by — so
 * nothing is resolved here.
 */
function onContractProductPick(
  next: { contractProduct?: string | null } | undefined
): void {
  const picked = next?.contractProduct;
  pickerModel.value = { contractProduct: picked };
  if (picked) router.push(`/useContractProduct/${picked}/as/client`);
}

/** The node flags a hand reads at a glance, beside the status badge. */
const nodeFlags = computed(() => {
  const m = meta.value;
  if (!m) return [];
  const flags = [
    {
      key: "pending",
      flag: m.isPending,
      label: t("labs.contract_product_meta_pending")
    },
    {
      key: "active",
      flag: m.isActive,
      label: t("labs.contract_product_meta_active")
    },
    {
      key: "suspended",
      flag: m.isSuspended,
      label: t("labs.contract_product_meta_suspended")
    },
    {
      key: "expiring",
      flag: m.isExpiring,
      label: t("labs.contract_product_meta_expiring")
    },
    {
      key: "cancelling",
      flag: m.isCancelling,
      label: t("labs.contract_product_meta_cancelling")
    },
    {
      key: "cancelled",
      flag: m.isCancelled,
      label: t("labs.contract_product_meta_cancelled")
    },
    {
      key: "lapsed",
      flag: m.isLapsed,
      label: t("labs.contract_product_meta_lapsed")
    },
    {
      key: "staged",
      flag: m.isStaged,
      label: t("labs.contract_product_meta_staged")
    },
    {
      key: "on-trial",
      flag: m.isOnTrial,
      label: t("labs.contract_product_meta_on_trial")
    },
    {
      key: "trial-ending",
      flag: m.isOnTerminatingTrial,
      label: t("labs.contract_product_meta_trial_ending")
    },
    {
      key: "delegated",
      flag: m.isDelegatedAccess,
      label: t("labs.contract_product_meta_delegated")
    },
    {
      key: "inactive",
      flag: m.isInactive,
      label: t("labs.contract_product_meta_inactive")
    },
    {
      key: "setup-incomplete",
      flag: m.isSetupIncomplete,
      label: t("labs.contract_product_meta_setup_incomplete")
    },
    {
      key: "fraud",
      flag: m.isFraud,
      label: t("labs.contract_product_meta_fraud")
    },
    {
      key: "imported",
      flag: m.isImported,
      label: t("labs.contract_product_meta_imported")
    },
    {
      key: "moved",
      flag: m.hasMoved,
      label: t("labs.contract_product_meta_moved")
    }
  ];
  return filter(flags, entry => entry.flag.value);
});

// `hasError` is NOT read: a form's validation error raises it while the
// product stays on `available`, and reading it would swap the form the
// client edits for the alert. A product record alone is not enough — an
// unrecognised status settles the machine on `#error` WITHOUT clearing it
// (D67), so readability also requires the product to have landed on one of
// the placed nodes — including the top-level `processing` node a formless
// write (withdraw/resume/revoke-scheduled) leaves `available` for.
const isReadable = computed(
  () =>
    !!contractProduct.value &&
    !!meta.value &&
    (meta.value.isAvailable.value ||
      meta.value.isStaged.value ||
      meta.value.isCancelled.value ||
      meta.value.isLapsed.value ||
      meta.value.isFraud.value ||
      meta.value.isProcessing.value)
);

function report(error: unknown): void {
  actionError.value =
    (error as { message?: string })?.message ?? t("error.something_went_wrong");
}

async function run(work: () => Promise<unknown>): Promise<void> {
  pending.value = true;
  actionError.value = undefined;
  try {
    await work();
  } catch (error) {
    report(error);
  } finally {
    pending.value = false;
  }
}

function openProduct(): void {
  const input = idInput.value.trim();
  if (!input) return;
  router.push(`/useContractProduct/${input}/as/client`);
}

const openCancellation = () => actions.value?.openCancellation();
const closeCancellation = () =>
  actions.value?.cancelForm(ContractProductFormTypes.CANCELLATION);
const submitCancellation = () => run(() => actions.value!.submitCancellation());

function onCancellationModelUpdate(
  model: Partial<CancellationModel> | undefined
): void {
  actions.value?.set(ContractProductFormTypes.CANCELLATION, model ?? {});
}

const openConsolidation = () => actions.value?.openConsolidation();
const closeConsolidation = () =>
  actions.value?.cancelForm(ContractProductFormTypes.CONSOLIDATION);
const submitConsolidation = () =>
  run(() => actions.value!.submitConsolidation());

function onConsolidationModelUpdate(
  model: Partial<SetConsolidationModel> | undefined
): void {
  actions.value?.set(ContractProductFormTypes.CONSOLIDATION, model ?? {});
}

// --- The direct writes
const reasonDraft = ref("");
const scheduleDate = ref("");

watch(
  minFutureCancellationDate,
  date => {
    if (date && !scheduleDate.value) scheduleDate.value = date;
  },
  { immediate: true }
);

/** The typed reason, omitted when blank so the write sends none. */
function reasonModel(): { reason?: string } {
  const reason = reasonDraft.value.trim();
  return reason ? { reason } : {};
}

const consolidationChoices = computed(() => [
  {
    value: InvoiceConsolidationTypes.DISABLED,
    key: "disabled",
    label: t("labs.contract_product_consolidation_disabled")
  },
  {
    value: InvoiceConsolidationTypes.ENABLED,
    key: "enabled",
    label: t("labs.contract_product_consolidation_enabled")
  },
  {
    value: InvoiceConsolidationTypes.INHERIT,
    key: "inherit",
    label: t("labs.contract_product_consolidation_inherit")
  }
]);

const stopRenewing = () =>
  run(() => actions.value!.stopRenewing(reasonModel()));
const scheduleCancellation = () =>
  run(() =>
    actions.value!.scheduleCancellation({
      futureCancellationDate: scheduleDate.value.trim(),
      ...reasonModel()
    })
  );
const setConsolidation = (value: InvoiceConsolidationTypes) =>
  run(() =>
    actions.value!.setConsolidation({ invoiceConsolidationEnabled: value })
  );

const withdraw = () => run(() => actions.value!.withdrawCancellation());
const resume = () => run(() => actions.value!.resumeRenewing());
const revokeScheduled = () =>
  run(() => actions.value!.revokeScheduledCancellation());
const refresh = () => run(async () => actions.value!.refresh());
const reset = () => run(() => actions.value!.reset());

onMounted(async () => {
  if (!actions.value) {
    booting.value = false;
    return;
  }
  await actions.value.isReady();
  booting.value = false;
});

onUnmounted(() => {
  void world.dispose();
  release();
});
</script>

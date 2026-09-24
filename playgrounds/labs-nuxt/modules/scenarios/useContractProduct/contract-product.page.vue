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
      <!-- No product in the url — the collection publishes no picker pair
           (D51), so this offers only the id itself. -->
      <Card v-if="!productId" size="sm" class="gap-4">
        <EmptyState
          :title="t('labs.contract_product_needs_id')"
          :description="t('labs.contract_product_needs_id_text')"
        >
          <template #icon><Icon icon="box" /></template>
        </EmptyState>

        <div class="flex items-end gap-3">
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
              {{ contractProduct?.status?.code }}
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
              <dt class="text-faint">{{ t("text.next_due_date") }}</dt>
              <dd data-test-key="contract-product-next-due-date">
                {{ contractProduct?.nextDueDate }}
              </dd>
            </div>
            <div>
              <dt class="text-faint">{{ t("text.billing_cycle") }}</dt>
              <dd>{{ contractProduct?.billingCycleMonths }}</dd>
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
            <div v-if="contractProduct?.calculatedCancelDate">
              <dt class="text-faint">
                {{ t("labs.contract_product_calculated_cancel_date") }}
              </dt>
              <dd data-test-key="contract-product-calculated-cancel-date">
                {{ contractProduct.calculatedCancelDate }}
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

          <!-- Formless writes, one row. -->
          <div class="flex flex-wrap gap-3 pt-2">
            <Button
              v-if="meta?.isCancelling.value"
              variant="outline"
              :disabled="pending || meta?.isProcessing.value"
              :data-attrs="{ 'data-test-key': 'contract-product-withdraw' }"
              @click="withdraw"
            >
              {{ t("labs.contract_product_withdraw") }}
            </Button>
            <Button
              v-if="meta?.isExpiring.value"
              variant="outline"
              :disabled="pending || meta?.isProcessing.value"
              :data-attrs="{ 'data-test-key': 'contract-product-resume' }"
              @click="resume"
            >
              {{ t("labs.contract_product_resume") }}
            </Button>
            <Button
              v-if="meta?.hasScheduledFutureCancellation.value"
              variant="outline"
              :disabled="pending || meta?.isProcessing.value"
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

        <!-- Cancellation — the ONE combined form (R33). No dialog opens empty:
             it renders only while the machine has filled `context.cancellation`
             (its own open transition builds the schema/uischema/model). -->
        <Card size="sm" class="gap-4">
          <div class="flex items-center justify-between">
            <span class="font-medium">
              {{ t("labs.contract_product_cancellation") }}
            </span>
            <Button
              v-if="
                meta?.hasCancellationOptions.value &&
                !meta?.isCancellationOpen.value &&
                !meta?.isConsolidationOpen.value
              "
              variant="outline"
              :disabled="pending || meta?.isProcessing.value"
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
            <UpmForm
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
              v-if="
                meta?.canConsolidate.value &&
                !meta?.isConsolidationOpen.value &&
                !meta?.isCancellationOpen.value
              "
              variant="outline"
              :disabled="pending || meta?.isProcessing.value"
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
            <UpmForm
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
 * shape), the formless writes (`withdrawCancellation`, `resumeRenewing`,
 * `revokeScheduledCancellation`), `refresh` and the force handle `reset`.
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
 * - `stopRenewing`, `scheduleCancellation`, `requestCancellation` and
 *   `setConsolidation` are the legacy DIRECT calls (open+set+submit in one) —
 *   this page drives the same writes through the form controls instead, so a
 *   hand can pick the option and see the schema the machine built for it.
 * - `isReady`/`onDone`/`stop`/`destroy` are lifecycle, not user capability.
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
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  ContractProductFormTypes,
  formRenderers,
  Icon,
  ScopeActorTypes,
  UpmForm,
  resolveSelfActor,
  useContractProduct
} from "@upmind-automation/client-vue";
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
import type { ScopeActor } from "@upmind-automation/scenario-harness";
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

// Booted once per mount — the page remounts per url, so the id is fixed
// here. CLIENT is the only actor the manager resolves; the matrix refuses
// every actor a `.for()` context, so `.as()` is the whole address.
const manager = productId.value
  ? useContractProduct().as(ScopeActorTypes.CLIENT).withId(productId.value)
  : undefined;

const actions = manager?.useActions();
const context = manager?.useContext();
const meta = manager?.useMeta();

// --- The page's own scenario transport (mirrors `ticket.page.vue`)
const actorScope = useActorScope();

const { tracks, states, player, isLocked } = useScenarioTransport({
  module: scenario.tracks,
  world: useScenarioWorld(registry, {
    key: CONTRACT_PRODUCT_SCENARIO,
    id: productId.value
  }),
  scope: () => ({ actor: resolveSelfActor(actorScope.value) as ScopeActor }),
  reset: actions?.reset
});

const contractProduct = computed(() => context?.contractProduct.value);
const description = computed(() => context?.description.value);
const readError = computed(() => context?.error.value?.message);
const validationErrors = computed(() => context?.validationErrors.value);
const scheduledActions = computed(() => context?.scheduledActions.value ?? []);
const minFutureCancellationDate = computed(
  () => context?.minFutureCancellationDate.value
);
const futureCancellationDate = computed(
  () =>
    contractProduct.value?.futureCancellationRequest?.future_cancellation_date
);
const cancellationForm = computed(() => context?.cancellation.value);
const consolidationForm = computed(() => context?.consolidation.value);

const booting = ref(true);
const pending = ref(false);
const actionError = ref<string>();
const idInput = ref("");

/** The node flags a hand reads at a glance, beside the status badge. */
const nodeFlags = computed(() => {
  const m = meta;
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
    !!meta &&
    (meta.isAvailable.value ||
      meta.isStaged.value ||
      meta.isCancelled.value ||
      meta.isLapsed.value ||
      meta.isFraud.value ||
      meta.isProcessing.value)
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

const openCancellation = () => actions?.openCancellation();
const closeCancellation = () =>
  actions?.cancelForm(ContractProductFormTypes.CANCELLATION);
const submitCancellation = () => run(() => actions!.submitCancellation());

function onCancellationModelUpdate(
  model: Partial<CancellationModel> | undefined
): void {
  actions?.set(ContractProductFormTypes.CANCELLATION, model ?? {});
}

const openConsolidation = () => actions?.openConsolidation();
const closeConsolidation = () =>
  actions?.cancelForm(ContractProductFormTypes.CONSOLIDATION);
const submitConsolidation = () => run(() => actions!.submitConsolidation());

function onConsolidationModelUpdate(
  model: Partial<SetConsolidationModel> | undefined
): void {
  actions?.set(ContractProductFormTypes.CONSOLIDATION, model ?? {});
}

const withdraw = () => run(() => actions!.withdrawCancellation());
const resume = () => run(() => actions!.resumeRenewing());
const revokeScheduled = () => run(() => actions!.revokeScheduledCancellation());
const refresh = () => run(async () => actions!.refresh());
const reset = () => run(() => actions!.reset());

onMounted(async () => {
  if (!actions) {
    booting.value = false;
    return;
  }
  await actions.isReady();
  booting.value = false;
});

onUnmounted(() => actions?.destroy());
</script>

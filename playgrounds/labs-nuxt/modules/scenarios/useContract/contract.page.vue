<template>
  <Page :data-attrs="{ 'data-test-key': 'contract-page' }">
    <PageHeader>
      <PageTitle>{{ t("labs.contract_title") }}</PageTitle>
      <PageDescription>
        {{ t("labs.contract_description") }}
      </PageDescription>
    </PageHeader>

    <ScenarioBar
      :player="player"
      :tracks="tracks"
      :states="states"
      class="mb-4"
    />

    <PageBody class="relative gap-8">
      <Card v-if="!contractId" size="sm" class="gap-4">
        <EmptyState
          :title="t('labs.contract_needs_id')"
          :description="t('labs.contract_needs_id_text')"
        >
          <template #icon><Icon icon="receipt" /></template>
        </EmptyState>

        <div class="flex items-end gap-3">
          <Input
            v-model="idInput"
            :placeholder="t('labs.contract_id_label')"
            :data-attrs="{ 'data-test-key': 'contract-id-input' }"
            @keyup.enter="openContract"
          />
          <Button
            :disabled="!idInput.trim()"
            :data-attrs="{ 'data-test-key': 'contract-open' }"
            @click="openContract"
          >
            {{ t("labs.contract_open") }}
          </Button>
        </div>
      </Card>

      <!-- Booting the addressed contract, or re-reading it (a write, a
           refresh or a reset all pass back through the machine's `loading`
           node). -->
      <div
        v-else-if="booting || meta?.isLoading.value"
        class="flex justify-center p-8"
      >
        <Spinner :label="t('text.loading')" />
      </div>

      <!-- A failed read settles on the top-level `error` node (D43). -->
      <Alert
        v-else-if="!isReadable"
        variant="danger"
        appearance="outline"
        :title="t('labs.contract_unavailable')"
        :description="readError || t('labs.contract_unavailable_text')"
        :data-attrs="{ 'data-test-key': 'contract-unavailable' }"
      />

      <template v-else>
        <Card size="sm" class="gap-4">
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-lg font-semibold" data-test-key="contract-title">
              {{ title }}
            </span>
            <StatusBadge
              size="sm"
              tone="neutral"
              data-test-key="contract-status"
            >
              {{ contractStatus }}
            </StatusBadge>
            <Badge
              v-for="flag in nodeFlags"
              :key="flag.key"
              size="sm"
              appearance="muted"
              :data-test-key="`contract-meta-${flag.key}`"
            >
              {{ flag.label }}
            </Badge>
          </div>

          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt class="text-faint">{{ t("text.next_due_date") }}</dt>
              <dd data-test-key="contract-next-due-date">
                {{ rawContract?.next_due_date }}
              </dd>
            </div>
            <div>
              <dt class="text-faint">{{ t("text.billing_cycle") }}</dt>
              <dd>{{ rawContract?.billing_cycle_months }}</dd>
            </div>
            <div v-if="cancellationRequestStatus">
              <dt class="text-faint">
                {{ t("text.cancellation_request_status") }}
              </dt>
              <dd data-test-key="contract-cancellation-request-status">
                {{ cancellationRequestStatus }}
              </dd>
            </div>
          </dl>

          <div class="flex flex-wrap gap-3 pt-2">
            <Button
              variant="ghost"
              :disabled="pending || meta?.isProcessing.value"
              :data-attrs="{ 'data-test-key': 'contract-refresh' }"
              @click="refresh"
            >
              {{ t("action.refresh") }}
            </Button>
            <Button
              variant="ghost"
              :disabled="pending || meta?.isProcessing.value"
              :data-attrs="{ 'data-test-key': 'contract-reset' }"
              @click="reset"
            >
              {{ t("labs.contract_reset") }}
            </Button>
          </div>
        </Card>

        <Alert
          v-if="actionError"
          variant="danger"
          appearance="muted"
          :title="actionError"
          :data-attrs="{ 'data-test-key': 'contract-action-error' }"
        />

        <!-- No dialog opens empty: the form renders only while the machine
             has filled `context.paymentMethod` on its open transition. -->
        <Card size="sm" class="gap-4">
          <div class="flex items-center justify-between">
            <span class="font-medium">
              {{ t("labs.contract_payment_method") }}
            </span>
            <Button
              v-if="!meta?.isFraud.value && !meta?.isPaymentMethodOpen.value"
              variant="outline"
              :disabled="pending || meta?.isProcessing.value"
              :data-attrs="{ 'data-test-key': 'contract-payment-method-open' }"
              @click="openPaymentMethod"
            >
              {{ t("labs.contract_payment_method_open") }}
            </Button>
          </div>

          <div
            v-if="paymentMethodForm"
            class="flex flex-col gap-3"
            data-test-key="contract-payment-method-form"
          >
            <UpmForm
              :schema="paymentMethodForm.schema"
              :uischema="paymentMethodForm.uischema"
              :model-value="paymentMethodForm.model"
              :additional-renderers="formRenderers"
              :additional-errors="validationErrors"
              :disabled="pending || meta?.isProcessing.value"
              no-actions
              size="sm"
              @update:model-value="onPaymentMethodModelUpdate"
            />
            <div class="flex justify-end gap-3">
              <Button
                variant="ghost"
                :disabled="pending || meta?.isProcessing.value"
                :data-attrs="{
                  'data-test-key': 'contract-payment-method-cancel'
                }"
                @click="closePaymentMethod"
              >
                {{ t("action.cancel") }}
              </Button>
              <Button
                :disabled="
                  !meta?.isValid.value || pending || meta?.isProcessing.value
                "
                :data-attrs="{
                  'data-test-key': 'contract-payment-method-submit'
                }"
                @click="submitPaymentMethod"
              >
                {{ t("labs.contract_payment_method_submit") }}
              </Button>
            </div>
          </div>

          <EmptyState
            v-else-if="meta?.isFraud.value"
            :title="t('labs.contract_payment_method_unavailable')"
          >
            <template #icon><Icon icon="credit-card-01" /></template>
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
 * @module scenarios/useContract/contract.page
 * @description The client×self contract MANAGER, drawn directly. It boots
 * `useContract().as(ScopeActorTypes.CLIENT).withId(id)`
 * from the id the route param carries, and drives the manager's own members:
 * the contract and its status, the payment-method form
 * (`openPaymentMethod`/`input`/`clear`/`update`), `refresh` and the force
 * handle `reset`.
 *
 * The form renders from its OWN context slot (`useContext().paymentMethod` =
 * `{ schema, uischema, model }`), which the machine fills on its open
 * transition with the client's stored cards as the enum — no dialog opens
 * empty. Submit is gated on `useMeta().isValid`; an invalid model shows
 * `useContext().validationErrors` on the form. The form is offered on every
 * node but `fraud` (R13), where the machine refuses to open it. `update`
 * resolves `false` and sends nothing when the model is empty or names the
 * method already in use (R31), and REJECTS when the node refuses the model —
 * this page wraps it in `run()`, which reports the rejection as `actionError`.
 *
 * NOT drawn, and named rather than faked:
 *
 * - `setPaymentMethod` is the DIRECT call (open+update in one) — this page
 *   drives the same write through the form controls instead.
 * - `isReady`/`onDone`/`stop`/`destroy` are lifecycle, not user capability.
 *
 * `hasError` is NOT read for readability: a refused model raises it while
 * the contract stays on its status node, and reading it would swap the form
 * the client edits for the alert.
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
  formRenderers,
  Icon,
  ScopeActorTypes,
  UpmForm,
  resolveSelfActor,
  useContract
} from "@upmind-automation/client-vue";
import ScenarioBar from "../runtime/components/ScenarioBar.vue";
import { useScenarioTransport } from "../runtime/composables/useScenarioTransport";
import { useScenarioWorld } from "../runtime/composables/useScenarioWorld";
import { registry } from "../runtime/registry";
import { scenarioPlayground } from "../runtime/ScenarioPlayground.styles";
import scenario, { CONTRACT_SCENARIO } from "./contract.scenario";
import { filter, isArray } from "lodash-es";
import type { SetPaymentMethodModel } from "@upmind-automation/client-vue";
import type { ScopeActor } from "@upmind-automation/scenario-harness";
import { useActorScope } from "~/composables/scope";

// Keyed by PATH, never `fullPath`: the contract id is a ROUTE PARAM, so the
// path alone remounts a fresh manager for a different contract — while the
// QUERY, which the scenario transport writes into, must not.
definePageMeta({
  key: route => route.path
});

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const contractId = computed(() => {
  const raw = route.params.id;
  const id = isArray(raw) ? raw[0] : raw;
  return id || undefined;
});

const manager = contractId.value
  ? useContract().as(ScopeActorTypes.CLIENT).withId(contractId.value)
  : undefined;

const actions = manager?.useActions();
const context = manager?.useContext();
const meta = manager?.useMeta();

const actorScope = useActorScope();

const { tracks, states, player, isLocked } = useScenarioTransport({
  module: scenario.tracks,
  world: useScenarioWorld(registry, {
    key: CONTRACT_SCENARIO,
    id: contractId.value
  }),
  scope: () => ({ actor: resolveSelfActor(actorScope.value) as ScopeActor }),
  reset: actions?.reset
});

const contract = computed(() => context?.contract.value);
const rawContract = computed(() => context?.rawContract.value);
const title = computed(() => context?.title.value);
const contractStatus = computed(() => context?.contractStatus.value);
const cancellationRequestStatus = computed(
  () => context?.cancellationRequestStatus.value
);
const readError = computed(() => context?.errors.value);
const validationErrors = computed(() => context?.validationErrors.value);
const paymentMethodForm = computed(() => context?.paymentMethod.value);

const booting = ref(true);
const pending = ref(false);
const actionError = ref<string>();
const idInput = ref("");

const nodeFlags = computed(() => {
  const m = meta;
  if (!m) return [];
  const flags = [
    {
      key: "pending",
      flag: m.isPending,
      label: t("labs.contract_meta_pending")
    },
    {
      key: "inactive",
      flag: m.isInactive,
      label: t("labs.contract_meta_inactive")
    },
    { key: "active", flag: m.isActive, label: t("labs.contract_meta_active") },
    {
      key: "suspended",
      flag: m.isSuspended,
      label: t("labs.contract_meta_suspended")
    },
    {
      key: "cancelling",
      flag: m.isCancelling,
      label: t("labs.contract_meta_cancelling")
    },
    {
      key: "cancelled",
      flag: m.isCancelled,
      label: t("labs.contract_meta_cancelled")
    },
    { key: "lapsed", flag: m.isLapsed, label: t("labs.contract_meta_lapsed") },
    { key: "fraud", flag: m.isFraud, label: t("labs.contract_meta_fraud") }
  ];
  return filter(flags, entry => entry.flag.value);
});

const isReadable = computed(
  () =>
    !!contract.value &&
    !!meta &&
    (meta.isAvailable.value ||
      meta.isCancelled.value ||
      meta.isLapsed.value ||
      meta.isFraud.value)
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

function openContract(): void {
  const input = idInput.value.trim();
  if (!input) return;
  router.push(`/useContract/${input}/as/client`);
}

const openPaymentMethod = () => actions?.openPaymentMethod();
const closePaymentMethod = () => actions?.clear();
const submitPaymentMethod = () => run(() => actions!.update());

function onPaymentMethodModelUpdate(
  model: Partial<SetPaymentMethodModel> | undefined
): void {
  void actions?.input(model ?? {})?.catch(report);
}

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

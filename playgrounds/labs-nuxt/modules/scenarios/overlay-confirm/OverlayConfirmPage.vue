<template>
  <div
    class="flex flex-col gap-6"
    data-test-key="confirm-overlay"
    :data-test-value="write"
  >
    <DialogHeader>
      <DialogTitle>{{
        t(confirmation?.title ?? "action.confirm")
      }}</DialogTitle>
      <DialogDescription v-if="productTitle">
        {{ productTitle }}
      </DialogDescription>
    </DialogHeader>

    <p v-if="message" data-test-key="confirm-message">
      {{ t(message, { entity: productTitle }) }}
    </p>

    <Alert
      v-if="actionError"
      variant="danger"
      appearance="outline"
      :title="actionError"
      :data-attrs="{ 'data-test-key': 'confirm-failed' }"
    />

    <DialogFooter>
      <Button
        variant="ghost"
        :disabled="pending"
        :data-attrs="{ 'data-test-key': 'confirm-cancel' }"
        @click="close"
      >
        {{ t("action.cancel") }}
      </Button>
      <Button
        :disabled="!isReady || pending"
        :loading="pending"
        :data-attrs="{ 'data-test-key': 'confirm-submit' }"
        @click="confirm"
      >
        {{ t("action.confirm") }}
      </Button>
    </DialogFooter>
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/overlay-confirm/OverlayConfirmPage
 * @description The confirmation MODAL — ONE overlay for every write that asks
 * first. Its route names the write: `/<record>/<segment>/confirm`, where the
 * segment is a key of `CONFIRM_WRITES`. Confirming runs the write on the same
 * `useContractProduct().as('client').withId(id)` instance the page beneath
 * holds, so its record and `issuedInvoice` update in place. A raised invoice
 * then opens at `/useInvoice/:id`; a write that raised none closes the modal
 * back onto the page, and a refusal keeps it open with its reason.
 *
 * The write is looked up in `CONFIRMATIONS`, never called by name off the url:
 * a name the table does not declare closes the modal and runs nothing. The copy
 * is legacy's (`cProdProvider.vue:689-699`, `:1570`); an end of trial reads
 * the product's own `trialEndAction`.
 */

import {
  Alert,
  Button,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import {
  OverlayType,
  QUERY_PARAMS,
  ScopeActorTypes,
  useContractProduct
} from "@upmind-automation/headless";
import { TrialEndActionTypes } from "@upmind-automation/types";
import { recordPath } from "../runtime/components/surfaces/record/record.utils";
import { get, has, isArray, omit, toString } from "lodash-es";
import { CONFIRM_WRITES } from "~/funnels/labs.constants";
import { ROUTE } from "~/funnels/types";

// -----------------------------------------------------------------------------

definePageMeta({
  name: ROUTE.OVERLAY_CONFIRM,
  overlay: OverlayType.MODAL,
  dismissable: true,
  size: "md"
});

const NEXT_INVOICE = "issueNextInvoice";
const END_TRIAL = "endTrial";

/** What each writable action asks, keyed by the manager action it runs. */
const CONFIRMATIONS: Record<string, { title: string }> = {
  [NEXT_INVOICE]: { title: "labs.contract_product_next_invoice" },
  [END_TRIAL]: { title: "labs.contract_product_end_trial" }
};

/** The end-of-trial question, one per outcome the product is set to. */
const END_TRIAL_MESSAGES: Record<TrialEndActionTypes, string> = {
  [TrialEndActionTypes.CANCEL]:
    "labs.contract_product_end_trial_confirm_cancel",
  [TrialEndActionTypes.MIGRATE]:
    "labs.contract_product_end_trial_confirm_migrate",
  [TrialEndActionTypes.CONTINUE]:
    "labs.contract_product_end_trial_confirm_continue"
};

const { t } = useI18n();
const route = useRoute();

const isReady = ref(false);
const pending = ref(false);
const actionError = ref<string>();

/** The write this route names: `/<record>/<segment>/confirm`. */
const write = get(
  CONFIRM_WRITES,
  toString(route.meta.overlayId).replace(/\/confirm$/, "")
) as string | undefined;
const confirmation =
  write && has(CONFIRMATIONS, write) ? get(CONFIRMATIONS, write) : undefined;

const productId = computed(() => {
  const raw = route.params.id;
  return (isArray(raw) ? raw[0] : raw) || undefined;
});

const manager = productId.value
  ? useContractProduct().as(ScopeActorTypes.CLIENT).withId(productId.value)
  : undefined;

const actions = manager?.useActions();
const context = manager?.useContext();

const productTitle = computed(() => context?.contractProduct.value?.title);

const message = computed(() => {
  if (write === NEXT_INVOICE)
    return "labs.contract_product_next_invoice_confirm";
  if (write !== END_TRIAL) return undefined;
  return get(
    END_TRIAL_MESSAGES,
    toString(context?.contractProduct.value?.trialEndAction),
    END_TRIAL_MESSAGES[TrialEndActionTypes.CONTINUE]
  );
});

/** The page this modal opened over: its own name less the `--<overlay>` suffix. */
function parentLocation() {
  return {
    name: toString(route.name).split("--")[0],
    params: route.params,
    query: omit(route.query, [QUERY_PARAMS.INIT])
  };
}

async function close(): Promise<void> {
  await navigateTo({ ...parentLocation(), replace: true });
}

/** A raised invoice opens; no invoice closes the modal; a refusal stays with its reason. */
async function settle(
  result: { id: string } | null | false | undefined
): Promise<void> {
  if (result === false || result === undefined) {
    actionError.value =
      context?.error.value?.message ?? t("error.something_went_wrong");
    return;
  }
  if (!result?.id) return close();
  await navigateTo({
    path: recordPath("/useInvoice/:id", result.id, route.params.scopeSuffix),
    replace: true
  });
}

/** A refused write (`false`) or a rejected one leaves the modal open with the reason. */
async function confirm(): Promise<void> {
  pending.value = true;
  actionError.value = undefined;
  return Promise.resolve()
    .then(() =>
      write === END_TRIAL ? actions?.endTrial() : actions?.issueNextInvoice()
    )
    .then(settle)
    .catch(error => {
      actionError.value =
        get(error, "message") ?? t("error.something_went_wrong");
    })
    .finally(() => {
      pending.value = false;
    });
}

onMounted(async () => {
  if (!confirmation || !actions) return close();
  await actions.isReady();
  isReady.value = true;
});
</script>

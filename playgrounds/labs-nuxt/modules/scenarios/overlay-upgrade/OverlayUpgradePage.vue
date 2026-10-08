<template>
  <div
    class="flex flex-col gap-6"
    data-test-key="contract-product-upgrade-overlay"
    :data-test-value="step"
  >
    <DialogHeader>
      <DialogTitle>{{ title }}</DialogTitle>
      <DialogDescription v-if="productTitle">
        {{ productTitle }}
      </DialogDescription>
    </DialogHeader>

    <template v-if="step === UpgradeStep.PICK">
      <EmptyState
        :title="t('labs.contract_product_needs_id')"
        :description="t('labs.contract_product_needs_id_text')"
      >
        <template #icon><Icon icon="switch-horizontal-01" /></template>
      </EmptyState>
      <Form
        v-if="pickerForm"
        :schema="pickerForm.schema"
        :uischema="pickerForm.uischema"
        :model-value="pickerModel"
        no-actions
        size="sm"
        data-test-key="contract-product-lookup"
        @update:model-value="onContractProductPick"
      />
    </template>

    <ul
      v-else-if="step === UpgradeStep.LOADING"
      :class="listClass"
      data-test-key="upgrade-targets-loading"
    >
      <UpmProductCardSkeleton v-for="n in SKELETON_COUNT" :key="n" />
    </ul>

    <EmptyState
      v-else-if="step === UpgradeStep.EMPTY"
      :title="t('text.no_migration_products_available')"
      :data-attrs="{ 'data-test-key': 'upgrade-no-targets' }"
    >
      <template #icon><Icon icon="switch-horizontal-01" /></template>
    </EmptyState>

    <Alert
      v-else-if="step === UpgradeStep.ERROR"
      variant="danger"
      appearance="outline"
      :title="t('error.generic_title')"
      :description="context?.error.value?.message"
      :data-attrs="{ 'data-test-key': 'upgrade-error' }"
    />

    <template v-else-if="step === UpgradeStep.CHOOSE">
      <ul :class="listClass" data-test-key="upgrade-targets">
        <UpmProductCard
          v-for="target in context?.migrationTargets.value"
          :key="target.id"
          v-bind="target"
          :configure-route="{}"
          :navigate="false"
          :action-label="t('action.review_changes')"
          :data-attrs="{ 'data-test-key': `upgrade-target-${target.id}` }"
          @resolve="actions?.selectMigrationTarget($event)"
        />
      </ul>
      <Button
        v-if="meta?.hasMoreMigrationTargets.value"
        variant="outline"
        class="self-center"
        :loading="meta?.isMigrationTargetsLoadingMore.value"
        :data-attrs="{ 'data-test-key': 'upgrade-load-more' }"
        @click="actions?.loadMoreMigrationTargets()"
      >
        {{ t("action.load_more") }}
      </Button>
    </template>

    <template v-else-if="step === UpgradeStep.CONFIGURE">
      <UpmConfigSkeleton v-if="meta?.isMigrationTargetLoading.value" />
      <Alert
        v-else-if="meta?.isMigrationTargetUnavailable.value"
        variant="danger"
        appearance="outline"
        :title="t('error.generic_title')"
        :description="context?.error.value?.message"
        :data-attrs="{ 'data-test-key': 'upgrade-target-unavailable' }"
      >
        <Button
          variant="outline"
          :data-attrs="{ 'data-test-key': 'upgrade-reload' }"
          @click="actions?.reloadMigrationTarget()"
        >
          {{ t("action.retry") }}
        </Button>
      </Alert>
      <MigrationForm
        v-else-if="context?.migrationConfig.value"
        :config="context.migrationConfig.value"
      />

      <DescriptionList
        :items="summary"
        orientation="horizontal"
        dividers
        size="sm"
        :data-attrs="{ 'data-test-key': 'upgrade-summary' }"
      >
        <template #description="{ item }">
          <Skeleton v-if="meta?.isMigrationPreviewing.value" class="h-4 w-24" />
          <template v-else>{{ item.description }}</template>
        </template>
      </DescriptionList>

      <Alert
        v-if="reviewMessage"
        variant="success"
        appearance="outline"
        :title="reviewMessage"
        :data-attrs="{ 'data-test-key': 'upgrade-review' }"
      />

      <Alert
        v-if="actionError"
        variant="danger"
        appearance="outline"
        :title="actionError"
        :data-attrs="{ 'data-test-key': 'upgrade-failed' }"
      />
    </template>

    <DialogFooter v-if="hasFooter">
      <Button
        v-if="step === UpgradeStep.CONFIGURE"
        variant="ghost"
        :disabled="meta?.isMigrationProcessing.value"
        :data-attrs="{ 'data-test-key': 'upgrade-back' }"
        @click="backToList"
      >
        {{ t("action.back") }}
      </Button>
      <Button
        v-else
        variant="ghost"
        :data-attrs="{ 'data-test-key': 'upgrade-cancel' }"
        @click="close"
      >
        {{ t("action.cancel") }}
      </Button>
      <Button
        v-if="step === UpgradeStep.CONFIGURE"
        :disabled="!meta?.canCommitMigration.value || pending"
        :loading="pending"
        :data-attrs="{ 'data-test-key': 'upgrade-commit' }"
        @click="commit"
      >
        {{ t("action.confirm_changes") }}
      </Button>
    </DialogFooter>
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/overlay-upgrade/OverlayUpgradePage
 * @description The upgrade MODAL — the surface `?init=upgrade` opens over the
 * contract-product page, injected as `<parent>--upgrade`. It is legacy's two
 * modals in one dialog (`migrationsListModal.vue` → `upgradeDowngradeModal.vue`
 * over `upgradeDowngradeForm.vue`), in legacy's own words: it opens straight
 * onto the products the plan allows a change to, drawn as the catalogue's own
 * product card; a choice opens the configurator, the pro-rata summary and the
 * commit. A commit that raised an unpaid invoice goes to that invoice with
 * `?init=pay`, as `cProdProvider.vue:1184-1196` does; any other closes the
 * modal and re-reads the product.
 *
 * It reads `useContractProduct().as('client').withId(id)` — the same instance
 * the page beneath holds, so the change is never left open on it when the
 * modal closes. With no id it draws the collection's own finder, and a pick
 * opens the product with the upgrade intent.
 */

import {
  Alert,
  Button,
  DescriptionList,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Skeleton
} from "@upmind/ui";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  OverlayType,
  QUERY_PARAMS,
  ScopeActorTypes,
  useContractProduct,
  useContractProducts
} from "@upmind-automation/headless";
import {
  ConfigSkeleton as UpmConfigSkeleton,
  ProductCard as UpmProductCard,
  ProductCardSkeleton as UpmProductCardSkeleton
} from "@upmind-automation/product";
import { Form, Icon } from "@upmind-automation/foundation";
import MigrationForm from "./MigrationForm.vue";
import { isArray, omit, toString } from "lodash-es";
import { ROUTE } from "~/funnels/types";

// -----------------------------------------------------------------------------

definePageMeta({
  name: ROUTE.OVERLAY_UPGRADE,
  overlay: OverlayType.MODAL,
  dismissable: true,
  size: "4xl"
});

const UpgradeStep = {
  PICK: "pick",
  LOADING: "loading",
  EMPTY: "empty",
  ERROR: "error",
  CHOOSE: "choose",
  CONFIGURE: "configure"
} as const;

/** Legacy's own page size (`migrationsListModal.vue` `limit: 4`). */
const SKELETON_COUNT = 4;

const listClass = "grid gap-4 sm:grid-cols-2";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const productId = computed(() => {
  const raw = route.params.id;
  const id = isArray(raw) ? raw[0] : raw;
  return id || undefined;
});

const manager = productId.value
  ? useContractProduct().as(ScopeActorTypes.CLIENT).withId(productId.value)
  : undefined;

const actions = manager?.useActions();
const context = manager?.useContext();
const meta = manager?.useMeta();

const booting = ref(!!manager);
const pending = ref(false);
const actionError = ref<string>();

const step = computed(() => {
  if (!manager) return UpgradeStep.PICK;
  if (booting.value || meta?.isLoading.value) return UpgradeStep.LOADING;
  if (meta?.isMigrationOpen.value && !meta.isChoosingMigrationTarget.value)
    return UpgradeStep.CONFIGURE;
  if (!meta?.canMigrate.value) return UpgradeStep.EMPTY;
  if (meta.isMigrationTargetsLoading.value) return UpgradeStep.LOADING;
  if (meta.hasMigrationTargetsError.value) return UpgradeStep.ERROR;
  if (meta.hasNoMigrationTargets.value) return UpgradeStep.EMPTY;
  return UpgradeStep.CHOOSE;
});

const title = computed(() =>
  step.value === UpgradeStep.CONFIGURE
    ? t("action.finalise_product_change")
    : t("text.select_new_product")
);

const productTitle = computed(() => context?.contractProduct.value?.title);

const newProductTitle = computed(
  () => context?.migrationTarget.value?.product.productDetails.title
);

const hasFooter = computed(() => step.value !== UpgradeStep.PICK);

const summary = computed(() => {
  const preview = context?.migrationPreview.value;
  const free = !!meta?.isMigrationFree.value;
  const dash = "–";

  return [
    {
      term: t("text.old_product"),
      description: productTitle.value ?? dash
    },
    {
      term: t("text.new_product"),
      description: newProductTitle.value ?? dash
    },
    {
      term: t("text.pro_rata_fee"),
      description: !preview
        ? dash
        : free
          ? t("text.nothing_to_pay")
          : preview.total,
      dataAttrs: { "data-test-key": "upgrade-cost" }
    },
    {
      term: t("text.effective"),
      description: !preview
        ? dash
        : free
          ? t("text.right_away")
          : t("text.after_invoice_payment")
    }
  ];
});

const reviewMessage = computed(() => {
  const preview = context?.migrationPreview.value;
  if (!preview || meta?.isMigrationPreviewing.value) return undefined;
  const names = {
    oldProductName: productTitle.value,
    newProductName: newProductTitle.value
  };
  return meta?.isMigrationFree.value
    ? t("text.review_changes_no_fee_msg", names)
    : t("text.review_changes_with_fee_msg", {
        ...names,
        proRataAmount: preview.total
      });
});

const picker = manager
  ? undefined
  : useContractProducts().as(ScopeActorTypes.CLIENT).fresh();

const pickerForm = picker?.useContext().schemas.contractProductPicker;

/** The picked id, held so the control draws its own selection back. */
const pickerModel = ref<{ contractProduct?: string | null }>({});

function onContractProductPick(
  next: { contractProduct?: string | null } | undefined
): void {
  const picked = next?.contractProduct;
  pickerModel.value = { contractProduct: picked };
  if (picked)
    void router.push({
      path: `/useContractProduct/${picked}/`,
      query: { [QUERY_PARAMS.INIT]: "upgrade" }
    });
}

/** The page this modal opened over: its own name less the `--upgrade` suffix. */
function parentLocation() {
  return {
    name: toString(route.name).replace(/--[^-]+$/, ""),
    params: route.params,
    query: omit(route.query, [QUERY_PARAMS.INIT])
  };
}

async function close(): Promise<void> {
  await navigateTo({ ...parentLocation(), replace: true });
}

/** Back to the list: the chosen product is let go and the list re-opens. */
function backToList(): void {
  actionError.value = undefined;
  actions?.cancelMigration();
  actions?.openMigration();
}

onMounted(async () => {
  await actions?.isReady();
  booting.value = false;
  if (meta?.canMigrate.value && !meta.isMigrationOpen.value)
    actions?.openMigration();
});

onUnmounted(() => {
  picker?.useActions().destroy();
  if (meta?.isMigrationOpen.value) actions?.cancelMigration();
});

/** The commit rejects when the platform refuses the change; the form stays open. */
async function commit(): Promise<void> {
  pending.value = true;
  actionError.value = undefined;
  return Promise.resolve()
    .then(() => actions?.migrate())
    .then(async result => {
      if (!result) return;
      if (result.invoiceId && meta?.isPaymentRequired.value)
        return navigateTo({
          path: `/useInvoice/${result.invoiceId}/`,
          query: { [QUERY_PARAMS.INIT]: "pay" }
        });
      await close();
      actions?.refresh();
    })
    .catch(error => {
      actionError.value = (error as Error).message;
    })
    .finally(() => {
      pending.value = false;
    });
}
</script>

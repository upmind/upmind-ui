<template>
  <div class="flex flex-col gap-4">
    <Alert
      v-if="!guestCheckoutEnabled"
      appearance="muted"
      variant="warning"
      class="max-w-xl"
      :title="t('labs.auth_guest_customer_disabled')"
      :data-attrs="{ 'data-test-key': 'auth-guest-customer-disabled' }"
    >
      <template #icon><Icon icon="alert-triangle" /></template>
    </Alert>

    <template v-else>
      <Alert
        v-if="hasErrors"
        variant="danger"
        class="max-w-xl"
        :title="t('error.session_register_failed')"
        :description="errors"
      >
        <template #icon><Icon icon="alert-triangle" /></template>
      </Alert>

      <div
        v-if="isProcessing"
        class="text-muted flex items-center gap-2"
        :data-test-key="'auth-guest-customer-running'"
      >
        <Icon icon="loading-01" class="animate-spin" />
        {{ t("labs.auth_guest_customer_running") }}
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module components/auth/AuthGuestCustomer
 * @description The gate's Guest Customer entry. It runs the client machine's
 * `registerAsGuest()` — a `guest_customer` grant stored as a normal client
 * session — and emits `resolve` for the host to continue as that new client,
 * the same hand-off the client login takes.
 *
 * The action is the tab: selecting it runs the machine, so registration starts
 * on mount rather than behind a second press. It is disabled with a surfaced
 * reason when the brand's `GUEST_CHECKOUT_ENABLED` config is off — the same
 * config the machine's `canRegisterAsGuest` guard reads, so the refusal shown
 * here matches the transition the machine would ignore anyway.
 */

import { Alert } from "@upmind/ui";
import { computed, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { Icon } from "@upmind-automation/client-vue";
import {
  ScopeActorTypes,
  useAuth,
  useBrand
} from "@upmind-automation/headless";
import { BrandConfigKeys } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const emit = defineEmits<{
  /** A guest-customer client session was minted — the host continues on it. */
  resolve: [];
}>();

const { t } = useI18n();

const { getConfigValue } = useBrand();

const guestCheckoutEnabled = computed(
  () => !!getConfigValue<boolean>(BrandConfigKeys.GUEST_CHECKOUT_ENABLED)
);

// A FRESH client instance, isolated from the Client tab's shared one: the gate
// opens on that tab, and switching to this one stops it — a shared instance
// would take the `GUEST` event already dead. `.fresh()` keys its own.
const auth = useAuth().as(ScopeActorTypes.CLIENT).fresh();
const actions = auth.useActions();
const { destroy, isReady } = actions;
const { hasErrors, isProcessing } = auth.useMeta();
const { errors } = auth.useContext();

async function run(): Promise<void> {
  if (!guestCheckoutEnabled.value) return;

  await isReady();
  if ("registerAsGuest" in actions && (await actions.registerAsGuest())) {
    emit("resolve");
  }
}

onMounted(run);

onUnmounted(() => {
  destroy();
});
</script>

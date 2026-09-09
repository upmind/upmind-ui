<template>
  <Alert
    v-if="meta.offersGuestCheckout"
    variant="neutral"
    :title="t('cart.guest_checkout_qn')"
    :class="props.class"
  >
    <template #icon><Icon icon="clock-fast-forward" /></template>
    <template #action>
      <Link
        size="sm"
        @click="props.registerAsGuest"
        color="inherit"
        :disabled="props.isRegistering"
        :data-attrs="{ 'data-test-key': 'guest-checkout-cta' }"
      >
        {{ t("cart.guest_checkout_action") }}
        <Spinner
          :label="t('text.loading')"
          v-if="props.isRegistering"
          size="xs"
          class="m-1.5"
        />
        <Icon v-else icon="arrow-right" size="xs" />
      </Link>
    </template>
  </Alert>
</template>

<script lang="ts" setup>
// The offer `auth` asks for through `foundation`'s shell socket. The gate reads
// the basket, which sits ABOVE `auth` in the ADR 023 §3 graph and so cannot be
// read there; the verb arrives as a prop instead.
import { Alert, Link, Spinner } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Icon } from "@upmind-automation/foundation";
import {
  ScopeActorTypes,
  useActiveSession,
  useAuth,
  useBasket
} from "@upmind-automation/headless";
import { offersGuestCheckout } from "../guest-checkout.utils";
// --- types
import type { GuestCheckoutOfferProps } from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<GuestCheckoutOfferProps>();

// -----------------------------------------------------------------------------

const { t } = useI18n();

const { isAuthenticated } = useActiveSession().useMeta();
const { canRegisterAsGuest } = useAuth().as(ScopeActorTypes.CLIENT).useMeta();
const { meta: basketMeta } = useBasket();

const meta = computed(() => ({
  offersGuestCheckout: offersGuestCheckout({
    isAuthenticated: isAuthenticated.value,
    canRegisterAsGuest: canRegisterAsGuest.value,
    isBasketLoading: basketMeta.value.isLoading,
    hasRecurringProducts: basketMeta.value.hasRecurringProducts
  })
}));
</script>

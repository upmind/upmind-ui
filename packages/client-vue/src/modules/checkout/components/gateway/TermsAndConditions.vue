<template>
  <i18n-t
    v-if="te('payment.termsAndConditions.text')"
    keypath="payment.termsAndConditions.text"
    tag="p"
    :class="styles.checkout.terms"
  >
    <template #[`action`]>
      {{ actionText }}
    </template>
    <template #[`terms`]>
      <Link
        v-if="uiCart?.terms_url"
        as="a"
        :href="uiCart.terms_url"
        target="_blank"
        class="font-normal text-inherit"
      >
        {{ t("payment.termsAndConditions.terms") }}
      </Link>
      <template v-else>{{ t("payment.termsAndConditions.terms") }}</template>
    </template>
    <template #[`privacy`]>
      <Link
        v-if="uiCart?.privacy_url"
        as="a"
        :href="uiCart.privacy_url"
        target="_blank"
        class="font-normal text-inherit"
      >
        {{ t("payment.termsAndConditions.privacy") }}
      </Link>
      <template v-else>{{ t("payment.termsAndConditions.privacy") }}</template>
    </template>
  </i18n-t>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useBrand } from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../../checkout.config";

// --- components
import { Link } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";

// --- props
interface Props {
  actionText: string;
}

defineProps<Props>();
const { t, te } = useI18n();
const { uiCart } = useBrand();

const styles = useStyles(["checkout"], {}, config) as ComputedRef<{
  checkout: {
    terms: string;
  };
}>;
</script>

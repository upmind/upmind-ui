<template>
  <template v-if="has(props, 'cycle')">
    <p v-if="!props.separate" class="text-faint text-sm">
      <RenewDescription
        :cycle="termDetails.cycle"
        :discounted="termDetails.meta?.discounted"
        :free-trial="termDetails.meta?.freeTrial"
        :regular-price="termDetails.price?.regularPrice"
        :renewal-price="termDetails.meta?.renewalPrice"
      />

      <TaxesDescription v-bind="termDetails" />
    </p>

    <div v-else>
      <p class="text-muted text-sm">
        <RenewDescription
          :cycle="termDetails.cycle"
          :discounted="termDetails.meta?.discounted"
          :free-trial="termDetails.meta?.freeTrial"
          :regular-price="termDetails.price?.regularPrice"
          :renewal-price="termDetails.meta?.renewalPrice"
        />
      </p>

      <p class="text-muted text-sm">
        <TaxesDescription v-bind="termDetails" />
      </p>
    </div>
  </template>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import RenewDescription from "./RenewDescription.vue";
import TaxesDescription from "./TaxesDescription.vue";

// --- utils
import { has, omit } from "lodash-es";

// --- types
import type { TermsDescriptionProps } from "./types";

// -----------------------------------------------------------------------------

defineOptions({
  inheritAttrs: false
});

const props = defineProps<TermsDescriptionProps>();

const termDetails = computed(() => omit(props, "separate"));
</script>

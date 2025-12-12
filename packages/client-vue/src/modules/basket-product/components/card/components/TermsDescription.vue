<template>
  <template v-if="has(props, 'cycle')">
    <p v-if="!props.separate" class="text-faint text-sm">
      <RenewDescription v-bind="termDetails" />

      <TaxesDescription v-bind="termDetails" />
    </p>

    <div v-else>
      <p class="text-muted text-sm">
        <RenewDescription v-bind="termDetails" />
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
import type { TermDetails } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

defineOptions({
  inheritAttrs: false
});

const props = defineProps<TermDetails & { separate?: boolean }>();

const termDetails = computed(() => omit(props, "separate"));
</script>

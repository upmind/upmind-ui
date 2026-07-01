<template>
  <Hero
    :title="t('domain.domain_title')"
    :subtitle="t('domain.domain_description')"
  >
    <template #default>
      <DomainSearch
        v-model="query"
        class="my-9"
        :searching="searching"
        :processing="processing"
        :type="type"
        @search="$emit('search', $event)"
        @reset="$emit('reset')"
      />
    </template>
  </Hero>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import Hero from "../../../components/hero/Hero.vue";
import DomainSearch from "./DomainSearch.vue";
import type { DomainSlotProps } from "../types";

const props = defineProps<DomainSlotProps>();

const { t } = useI18n();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "search", query: string): void;
  (e: "reset"): void;
}>();

const query = useVModel(props, "modelValue", emit);
</script>

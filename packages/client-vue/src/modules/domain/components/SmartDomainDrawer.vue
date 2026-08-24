<template>
  <DomainDrawer
    :open="props.open"
    :loading="props.searching || props.processing"
    @update:open="emit('update:open', $event)"
    @reset="props.empty ? emit('reset') : emit('resolve')"
  >
    <template #domain-type />

    <template #search>
      <DomainSearch
        :model-value="props.query"
        :searching="props.searching"
        :processing="props.processing"
        :type="props.type"
        @update:model-value="emit('update:query', $event ?? '')"
        @search="emit('search', $event)"
        @reset="emit('reset')"
      />
    </template>

    <template #results>
      <DomainCards
        :model-value="props.added"
        :items="props.available"
        :offset="props.offset"
        :query="props.searchQuery"
        :processing="props.processing"
        :loading="props.loading"
        :searching="props.searching"
        :valid="props.valid"
        :template="DOMAIN_TEMPLATE.DRAWER"
        :result-count="props.resultCount"
        :skeleton-count="5"
        @add="emit('add', $event)"
        @remove="emit('remove', $event)"
        @search-more="emit('searchMore')"
      />
    </template>

    <template #cancel>
      <Button
        variant="subtle"
        size="lg"
        :block="isMobile"
        :disabled="props.processing || props.loading"
        @click="emit('reset')"
      >
        {{ t("action.cancel") }}
      </Button>
    </template>

    <template #resolve>
      <Button
        variant="primary"
        size="lg"
        :loading="props.loading || props.disabled"
        :disabled="props.processing || props.empty"
        :block="isMobile"
        @click="emit('resolve')"
      >
        {{ t("action.continue_label") }}
        <Icon icon="arrow-right" />
      </Button>
    </template>
  </DomainDrawer>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Button } from "@upmind/ui";
import { Icon } from "../../../components/icon";
import { isMobile } from "../../../composables/isMobile";
import DomainDrawer from "../templates/DomainDrawer.template.vue";
import { DOMAIN_TEMPLATE } from "../types";
import DomainCards from "./DomainCards.vue";
import DomainSearch from "./DomainSearch.vue";
import type { SmartDomainDrawerProps } from "../types";

const props = defineProps<SmartDomainDrawerProps>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "update:query", value: string): void;
  (e: "search", value: string): void;
  (e: "searchMore"): void;
  (e: "add", value: string): void;
  (e: "remove", value: string): void;
  (e: "reset"): void;
  (e: "resolve"): void;
}>();

const { t } = useI18n();
</script>

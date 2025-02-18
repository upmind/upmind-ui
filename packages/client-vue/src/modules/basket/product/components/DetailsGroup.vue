<template>
  <div
    v-if="!hasProvisioning"
    class="flex flex-col gap-y-2 py-3 first:pt-0 last:pb-0"
  >
    <h5 class="text-emphasis-medium m-0 truncate">{{ category }}</h5>

    <template v-if="!invalid">
      <template v-for="(item, index) in items" :key="'details-item-' + index">
        <DetailsItem
          :id="id"
          v-bind="item"
          :free="item.meta?.free"
          :overrides="item.meta?.overrides"
          :pricing-key="item.key"
        />
      </template>
    </template>

    <template v-else>
      <router-link :to="editLink">
        <Button
          variant="link"
          size="sm"
          :label="t('product.configureNow')"
          color="error"
          class="inline-block h-5 underline"
        />
      </router-link>
    </template>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Button } from "@upmind-automation/upmind-ui";
import { some } from "lodash-es";

// --- components
import DetailsItem from "./DetailsItem.vue";

// --- types
import type { BasketProductSummaryDetail } from "@upmind-automation/headless-vue";

const props = defineProps<{
  id: string;
  category?: string;
  items: BasketProductSummaryDetail[];
}>();

const { t } = useI18n();

const editLink = computed(() => ({
  name: "product.edit",
  params: { bpid: props.id },
}));

const invalid = computed(() => some(props.items, "meta.invalid"));

const hasProvisioning = computed(() =>
  props.items.some(item => item.key.includes("provision_field"))
);
</script>

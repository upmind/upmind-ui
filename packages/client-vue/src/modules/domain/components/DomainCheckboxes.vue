<template>
  <section
    v-if="!meta.isEmpty"
    class="border-border-secondary mt-4 rounded-lg border p-4"
    data-testid="domain-checkboxes"
  >
    <header class="mb-3">
      <h4 class="text-fg-primary text-sm font-semibold">
        {{ t("domain.registrant_use_billing") }}
      </h4>
      <p class="text-fg-tertiary mt-1 text-xs">
        {{ t("domain.registrant_use_billing_msg") }}
      </p>
    </header>

    <div class="flex flex-col gap-2">
      <label
        v-for="status in statuses"
        :key="status.productId"
        class="border-border-secondary hover:border-border-brand hover:bg-bg-brand-secondary flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition-colors"
        :data-testid="`domain-checkbox-${status.domain}`"
      >
        <Checkbox
          :model-value="isChecked(status.productId)"
          @update:model-value="toggleDomain(status.productId)"
        />
        <span class="text-fg-primary flex-1 text-sm">
          {{ status.domain }}
        </span>
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
// --- external
import { onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useDomainRegistrant } from "@upmind-automation/headless";

// --- components
import { Checkbox } from "@upmind-automation/upmind-ui";

// --- utils
import { filter, includes, map } from "lodash-es";

// -----------------------------------------------------------------------------

/** v-model for checked domain product IDs */
const checkedIds = defineModel<string[]>({ default: () => [] });

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { meta, statuses, domainProducts } = useDomainRegistrant();

// --- default: all domains checked on mount
onMounted(() => {
  if (checkedIds.value.length === 0) {
    checkedIds.value = map(domainProducts.value, "id");
  }
});

// --- methods

function isChecked(productId: string): boolean {
  return includes(checkedIds.value, productId);
}

function toggleDomain(productId: string): void {
  if (isChecked(productId)) {
    checkedIds.value = filter(checkedIds.value, id => id !== productId);
  } else {
    checkedIds.value = [...checkedIds.value, productId];
  }
}
</script>

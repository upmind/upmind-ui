<template>
  <section
    v-if="hasDomainProducts"
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
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useDomainRegistrant } from "@upmind-automation/headless";

// --- components
import { Checkbox } from "@upmind-automation/upmind-ui";

// --- utils
import { forEach, includes, map, pull } from "lodash-es";

// -----------------------------------------------------------------------------

const emit = defineEmits<{
  (e: "apply", productIds: string[]): void;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { hasDomainProducts, statuses, domainProducts } = useDomainRegistrant();

/** Tracked selection of domain product IDs */
const checkedIds = ref<string[]>([]);

// --- default: all domains checked
onMounted(() => {
  checkedIds.value = map(domainProducts.value, "id");
});

// --- methods

function isChecked(productId: string): boolean {
  return includes(checkedIds.value, productId);
}

function toggleDomain(productId: string): void {
  if (isChecked(productId)) {
    pull(checkedIds.value, productId);
  } else {
    checkedIds.value.push(productId);
  }
}

/**
 * Returns the currently checked product IDs.
 * Called by the parent billing form when saving.
 */
function getCheckedIds(): string[] {
  return [...checkedIds.value];
}

defineExpose({ getCheckedIds });
</script>

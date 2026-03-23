<template>
  <div
    v-if="hasOptions"
    class="flex flex-col gap-2"
    data-testid="basket-product-option-upsells"
  >
    <template v-for="option in options" :key="option.id">
      <template v-for="value in option.values" :key="value.id">
        <div class="flex items-center justify-between gap-3 py-1">
          <div class="flex min-w-0 flex-col gap-0.5">
            <span class="text-default truncate text-sm font-medium">
              {{ value.title }}
            </span>
            <span v-if="value.price?.currentPrice" class="text-muted text-xs">
              {{ value.price.currentPrice }}
            </span>
          </div>

          <Switch
            :id="`option-${option.id}-${value.id}`"
            :model-value="isSelected(option.id, value.id)"
            :disabled="disabled || processing"
            size="sm"
            @update:modelValue="doToggle(option, value, $event)"
          />
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- components
import { Switch } from "@upmind-automation/upmind-ui";

// --- utils
import { isEmpty, some } from "lodash-es";

// --- types
import type { SubproductDetails } from "@upmind-automation/headless";
import type { SubproductValue } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

const props = defineProps<{
  /** Available product options for upsell. */
  options: SubproductDetails[];
  /** Current option selections model. */
  modelValue?: Record<string, Record<string, { productId: string }>>;
  /** Whether the controls are disabled. */
  disabled?: boolean;
  /** Whether an update is processing. */
  processing?: boolean;
}>();

const emits = defineEmits(["update:modelValue"]);

const hasOptions = computed(() => !isEmpty(props.options));

function isSelected(optionId: string, valueId: string): boolean {
  return some(props.modelValue?.[optionId], ["productId", valueId]);
}

function doToggle(
  option: SubproductDetails,
  value: SubproductValue,
  enabled: boolean
) {
  if (props.disabled) return;
  emits("update:modelValue", { option, value, enabled });
}
</script>

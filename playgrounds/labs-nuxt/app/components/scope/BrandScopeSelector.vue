<template>
  <Popover>
    <PopoverTrigger>
      <Button
        size="sm"
        variant="ghost"
        class="mx-2 gap-2"
        icon-append="chevron-down"
        :label="brandLabel"
      />
    </PopoverTrigger>
    <PopoverContent
      align="start"
      class="bg-card border-border w-80 border p-4 shadow-lg"
      :style="{ zIndex: 9999 }"
    >
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium">Brand ID</label>
          <p class="text-muted mb-2 text-xs">
            Leave empty for organization-wide mode
          </p>
        </div>
        <div class="flex gap-2">
          <Input
            v-model="brandInput"
            placeholder="Brand ID (empty for org-wide)"
            class="flex-1"
            @keyup.enter="handleApply"
          />
          <Button
            size="sm"
            icon="check"
            @click="handleApply"
            :disabled="!hasChanged"
          />
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref, watch } from "vue";
// --- internal
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@upmind-automation/upmind-ui";
import { useBrandScope } from "../../composables/scope";
import { useScopeNavigation } from "../../composables/scope/scope-utils";
import { capitalize } from "lodash-es";

// ------------------------------------------------------------------------------

defineProps<{}>();

const brandScope = useBrandScope();
const { updateScopeParam } = useScopeNavigation();

// --- Local state
const brandInput = ref<string>("");
const originalValue = ref<string>("");

// --- Initialize from current scope
watch(
  brandScope,
  scope => {
    const value = scope.mode === "org" ? "" : scope.brandId;
    brandInput.value = value;
    originalValue.value = value;
  },
  { immediate: true }
);

// --- Computed

/** Display label for brand trigger button. */
const brandLabel = computed(() => {
  if (brandScope.value.mode === "org") {
    return "Organization";
  }
  return capitalize(brandScope.value.brandId);
});

/** True if input differs from original value. */
const hasChanged = computed(() => {
  return brandInput.value !== originalValue.value;
});

// --- Methods

/** Apply brand change - navigate to new brand scope. */
async function handleApply() {
  if (!hasChanged.value) return;

  const newBrand = brandInput.value.trim() || undefined;
  await updateScopeParam("brandId", newBrand);
  originalValue.value = brandInput.value;
}
</script>

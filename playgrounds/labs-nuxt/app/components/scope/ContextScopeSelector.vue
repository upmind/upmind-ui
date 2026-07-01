<template>
  <Popover v-if="shouldShow">
    <PopoverTrigger>
      <Button
        size="sm"
        variant="ghost"
        class="mx-2 gap-2"
        icon-append="chevron-down"
        icon="layers-three-01"
        :label="contextLabel"
      />
    </PopoverTrigger>
    <PopoverContent
      align="end"
      class="bg-card border-border w-80 border p-4 shadow-lg"
      :style="{ zIndex: 9999 }"
    >
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium">Context</label>
          <p class="text-muted mb-2 text-xs">
            Select a context type and enter an ID
          </p>
        </div>

        <div class="space-y-3">
          <!-- Context type selection with radio list -->
          <RadioGroup v-model="contextTypeInput">
            <div class="space-y-1">
              <div
                v-for="type in availableTypes"
                :key="type"
                class="hover:bg-muted flex cursor-pointer items-center space-x-2 rounded-md px-3 py-2"
                @click="contextTypeInput = type"
              >
                <RadioGroupItem :value="type" :id="`context-${type}`" />
                <label
                  :for="`context-${type}`"
                  class="flex-1 cursor-pointer text-sm font-medium"
                >
                  {{ capitalize(type) }}
                </label>
              </div>
            </div>
          </RadioGroup>

          <!-- ID input with inline apply button -->
          <div v-if="contextTypeInput" class="flex gap-2">
            <Input
              v-model="contextIdInput"
              placeholder="Enter ID"
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

        <!-- Clear button only when context is active -->
        <div v-if="currentContext" class="flex justify-start">
          <Button size="sm" variant="ghost" color="danger" @click="handleClear">
            Clear Context
          </Button>
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
  PopoverTrigger,
  RadioGroup,
  RadioGroupItem
} from "@upmind-automation/upmind-ui";
import { useActorScope, useContextScope } from "../../composables/scope";
import { useScopeNavigation } from "../../composables/scope/scope-utils";
import { useContextScopeSelector } from "./useContextScopeSelector";
import { capitalize } from "lodash-es";
// --- types
import type { ScopeContext } from "@upmind-automation/headless";

// ------------------------------------------------------------------------------

defineProps<{}>();

const actorScope = useActorScope();
const currentContext = useContextScope();
const { hasContexts, getContextTypesForActor } = useContextScopeSelector();
const { updateScopeParam } = useScopeNavigation();

// --- Local state
const contextTypeInput = ref<string>("");
const contextIdInput = ref<string>("");
const originalType = ref<string>("");
const originalId = ref<string>("");

// --- Initialize from current context
watch(
  currentContext,
  context => {
    if (context) {
      contextTypeInput.value = context.type;
      contextIdInput.value = context.id;
      originalType.value = context.type;
      originalId.value = context.id;
    } else {
      contextTypeInput.value = "";
      contextIdInput.value = "";
      originalType.value = "";
      originalId.value = "";
    }
  },
  { immediate: true }
);

// --- Computed

/** Context types available for current actor. */
const availableTypes = computed(() =>
  getContextTypesForActor(actorScope.value)
);

/** Only show if contexts are registered AND actor has available contexts. */
const shouldShow = computed(
  () => hasContexts.value && availableTypes.value.length > 0
);

/** Display label for context trigger button. */
const contextLabel = computed(() => {
  if (currentContext.value) {
    return `${capitalize(currentContext.value.type)}: ${currentContext.value.id}`;
  }
  return "No Context";
});

/** True if input differs from original values. */
const hasChanged = computed(() => {
  if (!contextTypeInput.value) return false;
  if (!contextIdInput.value.trim()) return false;

  return (
    contextTypeInput.value !== originalType.value ||
    contextIdInput.value !== originalId.value
  );
});

// --- Methods

/** Apply context change - navigate to new context scope. */
async function handleApply() {
  if (!hasChanged.value) return;
  if (!contextTypeInput.value || !contextIdInput.value.trim()) return;

  const newContext: ScopeContext = {
    type: contextTypeInput.value,
    id: contextIdInput.value.trim()
  };

  await updateScopeParam("context", newContext);
  originalType.value = contextTypeInput.value;
  originalId.value = contextIdInput.value;
}

/** Clear context - remove from URL. */
async function handleClear() {
  contextTypeInput.value = "";
  contextIdInput.value = "";
  originalType.value = "";
  originalId.value = "";
  await updateScopeParam("context", undefined);
}
</script>

<template>
  <EmptyState
    v-if="meta.isEmptyCollection"
    :title="props.emptyTitle"
    :description="props.emptyDescription"
  />

  <PortalButton
    v-else-if="meta.isSingle && props.iconOnly"
    :variant="props.tone"
    :size="props.size"
    icon-only
    :aria-label="props.label"
    :as="meta.linkAs"
    :to="props.to"
    @click="onSelect(props.value ?? props.label)"
  >
    <component :is="props.icon" v-if="props.icon" />
  </PortalButton>

  <PortalButton
    v-else-if="meta.isSingle"
    :as="meta.linkAs"
    :to="props.to"
    :variant="props.tone"
    :size="props.size"
    :class="props.block && 'w-full'"
    @click="onSelect(props.value ?? props.label)"
  >
    <component :is="props.icon" v-if="props.icon" />
    {{ props.label }}
    <component :is="props.trailingIcon" v-if="props.trailingIcon" />
  </PortalButton>

  <div
    v-else-if="meta.isGroup"
    :class="['flex flex-wrap items-center', CONTROL_CLUSTER_GAP]"
  >
    <PortalButton
      v-for="action in props.actions"
      :key="action.value"
      :variant="action.tone ?? props.tone"
      :size="props.size"
      :disabled="action.disabledReason !== undefined"
      :title="action.disabledReason"
      @click="onSelect(action.value)"
    >
      {{ action.label }}
    </PortalButton>
  </div>

  <DropdownMenu v-else-if="meta.isDropdown" :items="dropdownItems">
    <template #trigger>
      <PortalButton :variant="props.tone">{{ props.label }}</PortalButton>
    </template>
  </DropdownMenu>

  <div v-else-if="meta.isSplit" class="inline-flex items-center">
    <PortalButton
      :variant="props.tone"
      class="rounded-e-none"
      @click="onSelect(props.label)"
    >
      {{ props.label }}
    </PortalButton>
    <DropdownMenu :items="dropdownItems">
      <template #trigger>
        <PortalButton
          :variant="props.tone"
          icon-only
          :aria-label="props.moreLabel"
          class="rounded-s-none border-s"
        >
          <ChevronDown />
        </PortalButton>
      </template>
    </DropdownMenu>
  </div>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/button/Button
 * @description The `button` module (tasks.md 5.4, `actions`-tagged) — the
 * board's single / group / dropdown / split forms, over `@upmind/ui`'s
 * `Button` and `DropdownMenu`. Labels and actions are config-owned data
 * (`ModuleRef.props`), never hardcoded here; selecting any control emits
 * `select` with the chosen action's value rather than acting on it itself —
 * the module renders, it does not decide.
 */
import { Button as PortalButton, DropdownMenu, EmptyState } from "@upmind/ui";
import { ChevronDown } from "lucide-vue-next";
import { computed } from "vue";
import { CONTROL_CLUSTER_GAP } from "../../variants";
import { BUTTON_MODULE_VARIANT } from "./types";
import { map } from "lodash-es";
import type { ButtonModuleEmits, ButtonModuleProps } from "./types";
import type { MenuItem } from "@upmind/ui";
import { NuxtLink } from "#components";

defineOptions({ name: "PortalButtonModule" });

const props = defineProps<ButtonModuleProps>();
const emits = defineEmits<ButtonModuleEmits>();

const meta = computed(() => {
  const hasActions = (props.actions?.length ?? 0) > 0;
  const isCollection =
    props.variant === BUTTON_MODULE_VARIANT.GROUP ||
    props.variant === BUTTON_MODULE_VARIANT.DROPDOWN;
  // A data-fed action set can empty out — a brand with no gateway to store a
  // card offers no "Add card" at all. With copy for it that reads as an empty
  // state; with none, an action cluster with nothing in it is nothing to
  // render, so every branch below declines it.
  const hasEmptyCopy = props.emptyTitle !== undefined;
  return {
    isSingle: props.variant === BUTTON_MODULE_VARIANT.SINGLE,
    // A `to` renders the single control as a NuxtLink through the primitive's
    // polymorphic `as` — explicit undefined falls back to the default button.
    linkAs: props.to === undefined ? undefined : NuxtLink,
    isGroup: props.variant === BUTTON_MODULE_VARIANT.GROUP && hasActions,
    isDropdown: props.variant === BUTTON_MODULE_VARIANT.DROPDOWN && hasActions,
    isSplit: props.variant === BUTTON_MODULE_VARIANT.SPLIT,
    isEmptyCollection: isCollection && !hasActions && hasEmptyCopy
  };
});

const dropdownItems = computed<MenuItem[]>(() =>
  map(props.actions ?? [], action => ({
    label: action.label,
    value: action.value,
    disabled: action.disabledReason !== undefined,
    onSelect: () => onSelect(action.value)
  }))
);

function onSelect(value: string) {
  // A control with a destination navigates and nothing else: dispatching on the
  // same click would run a store mutation off a link press.
  if (props.to !== undefined) return;
  emits("select", value);
}
</script>

<template>
  <BaseSelectCards
    v-bind="$props"
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
  >
    <template
      #root="{
        openValue,
        setOpenValue,
        items,
        onChange,
        handleOpenAutoFocus,
        props,
        selected,
      }"
    >
      <DropdownMenuRoot
        :open="openValue"
        @update:open="(val: boolean) => setOpenValue(val)"
        tabindex="-1"
      >
        <DropdownMenuTrigger as-child>
          <TriggerButton v-bind="{ selected, ...props }">
            <template #item="{ item }">
              <slot name="item" :item="item" />
            </template>
            <template #placeholder>
              <slot name="placeholder" />
            </template>
          </TriggerButton>
        </DropdownMenuTrigger>

        <DropdownMenuPortal>
          <DropdownMenuContent
            :class="cn(variants.select.content, props.contentClass)"
            :onOpenAutoFocus="handleOpenAutoFocus"
          >
            <DropdownMenuItem
              v-for="(item, i) in items"
              :key="item.value || i"
              tabindex="0"
              @click="onChange(item.value)"
              :class="variants.select.item"
            >
              <Label
                :for="`${name}-${overrideIndex + index || index}`"
                :class="cn(variants.select.label)"
              >
                <slot name="dropdown-item" v-bind="{ item, index }">
                  {{ item.label }}
                </slot>
              </Label>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
    </template>
  </BaseSelectCards>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./selectCards.config";

// --- components
import BaseSelectCards from "./BaseSelectCards.vue";
import TriggerButton from "./components/TriggerButton.vue";
import { Label } from "../label";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from "radix-vue";

// --- types
import type { SelectCardsProps } from "./types";
import type { ComputedRef } from "vue";

const props = withDefaults(defineProps<SelectCardsProps>(), {
  variant: "dropdown",
});

defineEmits(["update:modelValue"]);

const meta = computed(() => ({
  variant: props.variant,
  isCollapsible: props.variant === "collapsible",
}));

const variants = useStyles(
  ["select"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  select: {
    root: string;
    items: string;
    item: string;
    input: string;
    label: string;
    content: string;
  };
}>;
</script>

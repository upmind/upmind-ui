<template>
  <Hero
    v-if="
      title ||
      description ||
      !isEmptySlot('prepend', slots) ||
      !isEmptySlot('append', slots)
    "
    :title="title"
    :description="description"
    :badge="props.badge"
    size="3xl"
    v-auto-animate
  >
    <template #prepend>
      <slot name="prepend" />
    </template>
    <template #append>
      <slot name="append" />
    </template>
  </Hero>
</template>

<script setup lang="ts">
import { vAutoAnimate } from "@formkit/auto-animate";
import { useSlots } from "@upmind/ui";
import Hero from "../../../components/hero/Hero.vue";
import { isEmptySlot } from "../../../utils/isEmptySlot";
import type { CategoriesItemProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<CategoriesItemProps>();

const slots = useSlots();
</script>

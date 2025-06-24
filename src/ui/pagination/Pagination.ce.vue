<template>
  <PaginationRoot
    v-slot="{ page, pageCount }"
    :total="total"
    :page="props.page"
  >
    <PaginationList
      :class="
        cn('flex w-full items-center gap-2 md:justify-between', props.class)
      "
    >
      <PaginationPrev as-child>
        <Button
          variant="outline"
          size="md"
          class="w-full flex-1 md:w-56 md:flex-none"
          :disabled="page <= 1"
          @click="emit('prev')"
        >
          <Icon icon="arrow-left" size="2xs" />
        </Button>
      </PaginationPrev>

      <!-- TODO: Current pagination doesn't support direct page change so we should static text for now-->

      <p class="text-emphasis-medium hidden text-sm md:inline-block">
        Page {{ page }} of {{ pages }}
      </p>

      <PaginationNext as-child>
        <Button
          variant="outline"
          size="md"
          class="w-full flex-1 md:w-56 md:flex-none"
          :disabled="page >= pageCount"
          @click="emit('next')"
        >
          <Icon icon="arrow-right" size="2xs" />
        </Button>
      </PaginationNext>
    </PaginationList>
  </PaginationRoot>
</template>

<script setup lang="ts">
// --- components
import { Icon } from "../icon";
import { Button } from "../button";
import {
  PaginationEllipsis,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
  PaginationRoot,
} from "radix-vue";

// --- utils
import { cn } from "../../utils";

// --- types
import type { PaginationProps } from "./types";

const props = defineProps<PaginationProps>();

const emit = defineEmits<{
  next: [];
  prev: [];
}>();
</script>

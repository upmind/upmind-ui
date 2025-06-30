<template>
  <PaginationRoot
    v-slot="{ page, pageCount }"
    :total="total"
    :page="props.page"
  >
    <PaginationList :class="cn(styles.pagination.root, props.class)">
      <PaginationPrev as-child>
        <Button
          variant="outline"
          size="md"
          :class="styles.pagination.button"
          :disabled="page <= 1"
          @click="emit('prev')"
        >
          <Icon icon="arrow-left" size="2xs" />
        </Button>
      </PaginationPrev>

      <!-- TODO: Current pagination doesn't support direct page change so we should static text for now-->
      <p :class="styles.pagination.info">Page {{ page }} of {{ pages }}</p>

      <PaginationNext as-child>
        <Button
          variant="outline"
          size="md"
          :class="styles.pagination.button"
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
// --- external
import { computed, type ComputedRef } from "vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./pagination.config";

// --- components
import { Icon } from "../icon";
import { Button } from "../button";
import {
  PaginationList,
  PaginationNext,
  PaginationPrev,
  PaginationRoot
} from "radix-vue";

// --- types
import type { PaginationProps } from "./types";

const props = withDefaults(defineProps<PaginationProps>(), {
  // --- variants
  size: "md",
  alignment: "between",
  // --- styles
  uiConfig: () => ({}),
  class: ""
});

const emit = defineEmits<{
  next: [];
  prev: [];
}>();

const meta = computed(() => ({
  size: props.size,
  alignment: props.alignment
}));

const styles = useStyles(
  ["pagination"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  pagination: {
    root?: string;
    button?: string;
    info?: string;
  };
}>;
</script>

<template>
  <PaginationRoot
    v-slot="{ page, pageCount }"
    :total="total"
    :items-per-page="props.limit"
    :page="props.page"
    v-if="!!total"
  >
    <PaginationList :class="cn(styles.pagination.root, props.class)" data-testid="pagination-bar">
      <PaginationPrev as-child>
        <Button
          variant="subtle"
          size="lg"
          :class="styles.pagination.button"
          :disabled="lte(page, 1) || props.loading"
          @click="emit('prev')"
          data-testid="previous"
        >
          <Icon icon="arrow-left" size="2xs" />
        </Button>
      </PaginationPrev>

      <!-- TODO: Current pagination doesn't support direct page change so we should static text for now-->
      <p :class="styles.pagination.info" v-show="!props.loading">
        {{ displayedPaginationInfo(page, pageCount) }}
      </p>

      <PaginationNext as-child>
        <Button
          variant="subtle"
          size="lg"
          :class="styles.pagination.button"
          :disabled="gte(page, pageCount) || props.loading"
          @click="emit('next')"
          data-testid="next"
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

// --- utils
import { lte, gte } from "lodash-es";

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

/**
 * The parent component is responsible for providing an already translated string via the 'paginationInfo' prop.
 * However, since this child component does not have access to an i18n instance, it cannot perform the dynamic placeholder
 * (e.g., {page}, {pages}) replacement itself.
 * Therefore, this component must explicitly replace these placeholders with the actual current page and total pages values.
 * @param currentPage {number} - The current page number.
 * @param totalPages {number} - The total number of pages.
 * @returns {string} - The formatted pagination info string.
 */
const displayedPaginationInfo = (currentPage: number, totalPages: number) => {
  if (props.paginationInfo) {
    return props.paginationInfo
      .replace("{page}", currentPage.toString())
      .replace("{pages}", totalPages.toString());
  }
  // Otherwise, fall back to the default English string.
  return `Page ${currentPage} of ${totalPages}`;
};
</script>

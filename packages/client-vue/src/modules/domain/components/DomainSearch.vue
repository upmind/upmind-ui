<template>
  <FormControl formItemId="domain-search" auto-focus>
    <!-- Unified search bar: the bordered frame lives on the wrapper (focus-within
         lights it) so the leading icon, field and trailing actions share one
         border, exactly as the old composite Input did. -->
    <div
      class="rounded-field bg-surface shadow-field focus-within:ring-ring/15 flex min-h-19 w-full items-center gap-4 border border-(--border-control) pr-4 pl-6 text-xl font-medium transition focus-within:border-(--border-control-selected) focus-within:ring-[3px]"
    >
      <Icon
        icon="search-refraction"
        class="text-muted hidden size-5 shrink-0 md:block"
      />

      <input
        id="domain-search-input"
        v-bind="useTestAttrs({ key: 'input', value: 'domain-search-input' })"
        v-model="inputValue"
        :placeholder="placeholder"
        autocomplete="url"
        maxlength="63"
        :disabled="processing"
        class="placeholder:text-faint min-w-0 flex-1 bg-transparent outline-none disabled:cursor-not-allowed"
      />

      <Link
        v-show="!isEmpty(inputValue)"
        color="muted"
        :disabled="processing"
        class="hidden shrink-0 transition-opacity md:inline-flex"
        @click="emit('reset')"
      >
        <Icon icon="delete" />
      </Link>

      <Button
        :disabled="isEmpty(inputValue) || processing"
        :loading="meta.isSearching"
        size="lg"
        variant="subtle"
        class="shrink-0"
      >
        {{ searchLabel }}
        <Icon icon="arrow-right" />
      </Button>
    </div>
  </FormControl>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Link, Button, useTestAttrs } from "@upmind/ui";
import { FormControl } from "../../../components/form";
import { Icon } from "../../../components/icon";
import { isMobile } from "../../../composables/isMobile";
import { isEmpty } from "lodash-es";
import type { DomainSlotProps } from "../types";

// ----------------------------------------------------------------------------

const props = defineProps<DomainSlotProps>();

const emit = defineEmits<{
  (e: "search", query: string): void;
  (e: "reset"): void;
}>();

// ----------------------------------------------------------------------------

const { t } = useI18n();

const meta = computed(() => ({
  isSearching: props.searching
}));

const inputValue = defineModel<string>("modelValue");

const placeholder = computed(() => {
  if (isMobile.value) return t("domain.search");
  return t("form.domain_search.placeholder");
});

const searchLabel = computed(() => {
  if (isMobile.value) return "";
  return t("domain.search");
});
</script>

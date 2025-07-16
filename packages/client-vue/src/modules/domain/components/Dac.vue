<template>
  <FormControl autoFocus :formItemId="id" v-bind="$attrs">
    <DomainSearch
      v-model="queryValue"
      :showComplete="meta.showComplete"
      :isLoading="meta.isLoading"
      :type="type"
      @search="onSearch"
    />
  </FormControl>

  <div :class="styles.domain.root">
    <DomainCards
      :model-value="selected"
      :items="items"
      :offset="offset"
      :loading="meta.isLoading"
      :processing="meta.isProcessing"
      @update:selected="onToggleSelected"
      :color="color"
      :value="props.modelValue ?? ''"
      @remove="onRemove"
    />

    <Button
      v-if="meta.hasItems && meta.hasMore"
      :label="t('domain.dac.actions.more')"
      :loading="meta.isLoading"
      @click="onSearchOffset"
      block
      variant="ghost"
      color="base"
    />
  </div>

  <div :class="styles.domain.actions" v-if="meta.hasItems">
    <Button
      :loading="meta.isProcessing"
      :disabled="meta.isEmpty || meta.isDisabled || meta.isProcessing"
      @click="onResolve"
      :label="t('domain.dac.actions.continue', selected?.length)"
      prependIcon="plus"
      :color="color"
    />
    <!-- </div> -->
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref, watch, type ComputedRef } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../domain.config";

// --- components
import {
  Button,
  Drawer,
  FormControl,
  Input
} from "@upmind-automation/upmind-ui";
import DomainCards from "./DomainCards.vue";
import DomainSearch from "./DomainSearch.vue";
import type { DacProps } from "../types";

// -----------------------------------------------------------------------------

const emit = defineEmits<{
  (e: "resolve"): void;
  (e: "search", query: string): void;
  (e: "search:more", offset: number): void;
  (e: "update:selected", value: string): void;
  (e: "remove", value: string): void;
  (e: "reset"): void;
}>();

const props = withDefaults(defineProps<DacProps>(), {
  offset: 0,
  selected: () => [],
  items: () => [],
  color: "primary"
});

const { t } = useI18n();

// our internal drawer state
const open = ref(false);
watch(props, ({ complete, items, loading, processing }) => {
  open.value = !complete && (loading || processing || !!items?.length);
});

watch(open, value => {
  if (!value) {
    emit("reset");
  }
});

const meta = computed(() => ({
  hasDomain: !!props.modelValue,
  isEmpty: !props.selected?.length,
  hasItems: !!props.items?.length,
  hasMore: props.more,
  isLoading: props.loading,
  isDisabled: props.disabled,
  isProcessing: props.processing,
  showComplete: props.complete
}));

const styles = useStyles(["domain"], meta, config) as ComputedRef<{
  domain: {
    root: string;
    actions: string;
    search: string;
  };
}>;

const queryValue = ref(props.query);

function onResolve() {
  emit("resolve");
}
function onSearch(value: string | number) {
  emit("search", value?.toString());
}
function onSearchOffset(value: number) {
  emit("search:more", value);
}
function onToggleSelected(value: string) {
  if (meta.value.isProcessing) return;
  emit("update:selected", value);
}
function onRemove(value: string) {
  emit("remove", value);
}
</script>

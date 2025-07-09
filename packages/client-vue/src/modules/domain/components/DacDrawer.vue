<template>
  <FormControl :invalid="false" autoFocus :formItemId="id">
    <Input
      :class="styles.domain.search"
      @update:modelValue="onSearch"
      :prependIcon="meta.showComplete ? null : 'search'"
      :placeholder="t('domain.dac.search')"
      autocomplete="url"
      v-model="queryValue"
    />
  </FormControl>

  <Drawer
    v-model:open="open"
    dismissible
    class="bg-white"
    to="#vue-app"
    fit="cover"
    skrim="primary"
    :class="styles.domain.drawer.root"
    :class-header="styles.domain.drawer.header"
    :class-content="styles.domain.drawer.content"
    :class-footer="styles.domain.drawer.footer"
    :dismissable="false"
    :title="t('domain.dac.title')"
    :description="t('domain.dac.description')"
    :overflow="meta.isLoading ? 'hidden' : 'auto'"
  >
    <template #header>
      <FormControl autoFocus :formItemId="id">
        <DomainSearch
          v-model="queryValue"
          :showComplete="meta.showComplete"
          :isLoading="meta.isLoading"
          :type="type"
          @search="onSearch"
        />
      </FormControl>
    </template>

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
        v-if="meta.showDialog && meta.hasItems && meta.hasMore"
        :label="t('domain.dac.actions.more')"
        :loading="meta.isLoading"
        @click="onSearchOffset"
        block
        variant="ghost"
        color="base"
      />
    </div>

    <template #close>
      <Button
        @click="onReject"
        :label="t('domain.dac.actions.cancel')"
        variant="link"
        color="base"
      />
    </template>

    <template #actions>
      <!-- <div :class="styles.domain.dialog.container"> -->

      <Button
        :loading="meta.isProcessing"
        :disabled="meta.isEmpty || meta.isDisabled || meta.isProcessing"
        @click="onResolve"
        :label="t('domain.dac.actions.continue', selected?.length)"
        prependIcon="plus"
        :color="color"
      />
      <!-- </div> -->
    </template>
  </Drawer>
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
  (e: "reject"): void;
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
  dialog: true,
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
  showComplete: props.complete,

  // ---
  showDialog: props.dialog && open.value
}));

const styles = useStyles(
  ["domain", "domain.drawer"],
  meta,
  config
) as ComputedRef<{
  domain: {
    root: string;
    search: string;
    dialog: {
      container: string;
    };
    drawer: {
      root: string;
      header: string;
      content: string;
      footer: string;
    };
  };
}>;

const queryValue = ref(props.query);

function onReject() {
  emit("reject");
}
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

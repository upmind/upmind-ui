<template>
  <FormControl
    v-if="!meta.showDialog"
    :invalid="false"
    autoFocus
    :formItemId="id"
  >
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
    v-else
    to="#vue-app"
    fit="cover"
    skrim="primary"
    :class="styles.domain.drawer.root"
    :class-header="styles.domain.drawer.header"
    :class-content="styles.domain.drawer.content"
    :class-footer="styles.domain.drawer.footer"
    v-model:open="open"
    :dismissable="false"
    :title="t('domain.dac.title')"
    :description="t('domain.dac.description')"
    @close="onReject"
  >
    <template #header>
      <FormControl autoFocus :formItemId="id">
        <Input
          :class="styles.domain.search"
          @update:modelValue="onSearch"
          :prependIcon="meta.showComplete ? null : 'search'"
          :placeholder="t('domain.dac.search')"
          autocomplete="url"
          v-model="queryValue"
        />
      </FormControl>
    </template>

    <div :class="styles.domain.root">
      <DomainCards
        :model-value="values"
        :items="items"
        :offset="offset"
        :loading="meta.isLoading"
        :processing="meta.isProcessing"
        @update:selected="onToggleSelected"
        :color="color"
      />

      <Button
        v-if="meta.showDialog && meta.hasItems && meta.hasMore"
        :label="t('domain.dac.actions.more')"
        :loading="meta.isLoading"
        @click="onSearchOffset"
        block
        variant="ghost"
        :color="color"
      />
    </div>

    <template #close>
      <Button
        @click="onReject"
        :label="t('domain.dac.actions.cancel')"
        variant="link"
        :color="color"
      />
    </template>

    <template #actions>
      <!-- <div :class="styles.domain.dialog.container"> -->

      <Button
        :loading="meta.isProcessing"
        :disabled="meta.isEmpty || meta.isDisabled || meta.isProcessing"
        @click="onResolve"
        :label="t('domain.dac.actions.continue', values?.length)"
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
import { useStyles, cn, type ButtonProps } from "@upmind-automation/upmind-ui";
import config from "./config.cva";

// --- components
import {
  Input,
  Button,
  Drawer,
  FormControl,
} from "@upmind-automation/upmind-ui";
import DomainCards from "./DomainCards.vue";
import type { DacProps } from "./types";

// -----------------------------------------------------------------------------

const emit = defineEmits<{
  (e: "reject"): void;
  (e: "resolve"): void;
  (e: "search", query: string): void;
  (e: "search:more", offset: number): void;
  (e: "update:selected", value?: string): void;
}>();

const props = withDefaults(defineProps<DacProps>(), {
  offset: 0,
  values: () => [],
  items: () => [],
  dialog: true,
  color: "base",
});

const { t } = useI18n();

// our internal drawer state
const open = ref(false);
watch(props, ({ complete, items, loading, processing }) => {
  open.value = !complete && (loading || processing || !!items?.length);
});

const meta = computed(() => ({
  hasDomain: !!props.modelValue,
  isEmpty: !props.values?.length,
  hasItems: !!props.items?.length,
  hasMore: props.more,
  isLoading: props.loading,
  isDisabled: props.disabled,
  isProcessing: props.processing,
  showComplete: props.complete,

  // ---
  showDialog: props.dialog && open.value,
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
function onToggleSelected(value?: string) {
  if (meta.value.isProcessing) return;
  emit("update:selected", value);
}
</script>

<template>
  <FormControl v-if="!meta.showDialog" autoFocus :formItemId="id">
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
    fit="cover"
    skrim="primary"
    :class="styles.domain.drawer.root"
    :class-header="styles.domain.drawer.header"
    :class-content="styles.domain.drawer.content"
    :class-footer="styles.domain.drawer.footer"
    v-model:open="open"
    persistent
    :title="t('domain.dac.title')"
    :description="t('domain.dac.description')"
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
      <DomainListings
        :model-value="values"
        :items="items"
        :offset="offset"
        :loading="meta.isLoading"
        :processing="meta.isProcessing"
        @toggle="onUpdate"
      />

      <Button
        v-if="meta.showDialog && meta.hasItems && meta.hasMore"
        :label="t('domain.dac.actions.more')"
        :loading="meta.isLoading"
        @click="onSearchOffset"
        block
        variant="ghost"
      />
    </div>

    <template #close>
      <Button
        @click="onReject"
        :label="t('domain.dac.actions.cancel')"
        variant="link"
      />
    </template>

    <template #actions>
      <!-- <div :class="styles.domain.dialog.container"> -->

      <Button
        :loading="meta.isProcessing"
        :disabled="meta.isEmpty || meta.isDisabled || meta.isProcessing"
        @click="onResolve"
        :label="t('domain.dac.actions.continue', values?.length)"
        prependIcon="plus-circle"
      />
      <!-- </div> -->
    </template>
  </Drawer>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles, cn } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { Input, Button, Drawer, FormControl } from "@upmind/upwind";
import DomainListings from "./DomainCards.vue";

// -----------------------------------------------------------------------------

const emit = defineEmits([
  "toggle",
  "search",
  "search:more",
  "resolve",
  "reject",
]);
const props = withDefaults(
  defineProps<{
    id: string;
    modelValue: string;
    query: string;
    offset: number;
    values: string[];
    items: string[];
    dialog: boolean;
    loading: boolean;
    processing: boolean;
    disabled: boolean;
    complete: boolean;
    more: boolean;
  }>(),
  {
    offset: 0,
    values: () => [],
    items: () => [],
    dialog: true,
  }
);

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

const styles = useStyles(["domain", "domain.drawer"], meta, config);

const queryValue = ref(props.query);

function onReject() {
  emit("reject");
}
function onResolve() {
  emit("resolve");
}
function onSearch(value) {
  emit("search", value);
}
function onSearchOffset(value) {
  emit("search:more", value);
}
function onUpdate(value) {
  if (meta.value.isProcessing) return;
  emit("toggle", value);
}
</script>

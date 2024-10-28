<template>
  <Input
    v-if="!meta.showDialog"
    :class="styles.domain.search"
    @update:modelValue="onSearch"
    :prependIcon="meta.showComplete ? null : 'search'"
    :placeholder="t('domain.dac.search')"
    autoFocus
    autocomplete="url"
    v-model="queryValue"
  />

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
      <Input
        :class="styles.domain.search"
        @update:modelValue="onSearch"
        :prependIcon="meta.showComplete ? null : 'search'"
        :placeholder="t('domain.dac.search')"
        autoFocus
        autocomplete="url"
        v-model="queryValue"
      />
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

<script>
// --- external
import { computed, defineComponent, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles, cn } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { Input, Button, Drawer } from "@upmind/upwind";
import UpmDomainListings from "./Listings.vue";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmDac",
  components: {
    Button,
    Drawer,
    Input,
    // ---
    UpmDomainListings,
  },
  emits: ["toggle", "search", "search:more", "resolve", "reject"],
  props: {
    modelValue: { type: String },
    query: { type: String },
    offset: { type: Number, default: 0 },
    values: { type: Array, default: () => [] },
    items: { type: Array, default: () => [] },
    dialog: { type: Boolean, default: true },
    // ---
    loading: { type: Boolean },
    processing: { type: Boolean },
    disabled: { type: Boolean },
    complete: { type: Boolean },
    more: { type: Boolean },
  },
  setup(props) {
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

    return {
      t,
      styles,
      cn,
      meta,
      config,
      queryValue: ref(props.query),
      open,
    };
  },

  computed: {},
  methods: {
    onReject() {
      this.$emit("reject");
    },
    onResolve() {
      this.$emit("resolve");
    },
    onSearch(value) {
      this.$emit("search", value);
    },
    onSearchOffset(value) {
      this.$emit("search:more", value);
    },
    onUpdate(value) {
      if (this.meta.isProcessing) return;
      this.$emit("toggle", value);
    },
  },
});
</script>

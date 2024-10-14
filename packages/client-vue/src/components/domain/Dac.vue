<template>
  <component
    :is="meta.showDialog ? 'upw-dialog' : 'div'"
    size="full"
    :model-value="true"
    persistent
    :upwind-config="config.domain"
  >
    <div :class="styles.domain.root">
      <upw-textbox
        :class="styles.domain.search"
        @update:modelValue="onSearch"
        :prependIcon="meta.showComplete ? null : 'search'"
        :placeholder="$t('domain.dac.search')"
        autofocus
        autocomplete="url"
        :model-value="query"
      />

      <upm-domain-listings
        v-if="meta.showDialog"
        :model-value="values"
        :items="items"
        :offset="offset"
        :loading="meta.isLoading"
        :processing="meta.isProcessing"
        @update:modelValue="onUpdate"
        @toggle="onUpdate"
      />

      <upw-button
        v-if="meta.showDialog && meta.hasItems && meta.hasMore"
        :label="$t('domain.dac.actions.more')"
        :loading="meta.isLoading"
        @click="onSearchOffset"
        block
        variant="ghost"
      />
    </div>
    <template #actions>
      <div :class="styles.domain.dialog.container">
        <upw-button
          @click="onReject"
          :label="$t('domain.dac.actions.cancel')"
          variant="link"
        />
        <upw-button
          :loading="meta.isProcessing"
          :disabled="meta.isEmpty || (!meta.showContinue && !meta.isProcessing)"
          @click="onResolve"
          :label="$tc('domain.dac.actions.continue', values?.length)"
          prependIcon="plus-circle"
        />
      </div>
    </template>
  </component>
</template>

<script>
// --- external
import { computed, defineComponent } from "vue";

// --- internal
import { useStyles, mergeStyles } from "@upmind-automation/upwind";
import config from "./config.cva";

// --- components
import { UpwTextbox, UpwButton, UpwDialog } from "@upmind-automation/upwind";
import UpmDomainListings from "./Listings.vue";

// --- utils

// --- types
// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmDac",
  components: {
    UpwTextbox,
    UpwButton,
    UpwDialog,
    // ---
    UpmDomainListings,
  },
  emits: ["toggle", "search", "search:more", "resolve", "reject"],
  props: {
    modelValue: { type: String },
    query: { type: String, default: "" },
    offset: { type: Number, default: 0 },
    values: { type: Array, default: () => [] },
    items: { type: Array, default: () => [] },
    dialog: { type: Boolean, default: true },
    // ---
    loading: { type: Boolean, default: false },
    processing: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    continue: { type: Boolean, default: false },
    complete: { type: Boolean, default: false },
    hasMore: { type: Boolean, default: false },
  },
  setup(props) {
    const meta = computed(() => ({
      hasDomain: !!props.modelValue,
      isEmpty: !props.values?.length,
      hasItems: !!props.items?.length,
      hasMore: props.hasMore,
      isLoading: props.loading,
      isDisabled: props.disabled,
      isProcessing: props.processing,
      showContinue: props.continue,
      showComplete: props.complete,
      hasSynced: props.synced,

      // ---
      showDialog:
        props.dialog &&
        !props.complete &&
        (props.loading || props.processing || !!props.items?.length),
    }));
    const styles = useStyles(["domain", "domain.dialog"], meta, config);

    return {
      styles,
      mergeStyles,
      meta,
      config,
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
      if (this.meta.isDisabled || this.meta.isProcessing) return;
      this.$emit("toggle", value);
    },
  },
});
</script>

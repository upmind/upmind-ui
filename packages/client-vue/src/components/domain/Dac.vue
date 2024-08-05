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
        :loading="meta.isLoading"
        :processing="meta.isProcessing"
        @update:modelValue="onUpdate"
        @toggle="onUpdate"
      />
    </div>
    <template #actions="">
      <upw-button
        :loading="meta.isProcessing"
        @click="onReject"
        :label="$t('domain.dac.actions.cancel')"
        variant="link"
      />
      <upw-button
        :loading="meta.isProcessing"
        :disabled="meta.isEmpty || (!meta.showContinue && !meta.isProcessing)"
        @click="onResolve"
        :label="$t('domain.dac.actions.continue')"
        prependIcon="plus-circle"
      />
    </template>
  </component>
</template>

<script>
// --- external
import { computed, defineComponent } from "vue";

// --- internal
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { UpwTextbox, UpwButton, UpwDialog } from "@upmind/upwind";
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
  emits: ["toggle", "search", "resolve", "reject"],
  props: {
    modelValue: { type: String },
    query: { type: String, default: "" },
    values: { type: Array, default: () => [] },
    items: { type: Array, default: () => [] },
    dialog: { type: Boolean, default: true },
    // ---
    loading: { type: Boolean, default: false },
    processing: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    continue: { type: Boolean, default: false },
    complete: { type: Boolean, default: false },
  },
  setup(props) {
    const meta = computed(() => ({
      hasDomain: !!props.modelValue,
      isEmpty: !props.values?.length,
      hasItems: !!props.items?.length,
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
    const styles = useStyles(["domain"], meta, config);

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
    onUpdate(value) {
      if (this.meta.isDisabled || this.meta.isProcessing) return;
      this.$emit("toggle", value);
    },
  },
});
</script>

<template>
  <div v-if="!meta.showDialog">
    <UpwTextbox
      :class="styles.domain.search"
      @update:modelValue="onSearch"
      :prependIcon="meta.showComplete ? null : 'search'"
      :placeholder="$t('domain.dac.search')"
      autofocus
      autocomplete="url"
      :model-value="query"
    />
  </div>
  <Drawer
    v-else
    fit="cover"
    persistent
    size="full"
    skrim="light"
    open
    :class="styles.domain.drawer.root"
    :class-header="styles.domain.drawer.header"
    :class-content="styles.domain.drawer.content"
    :class-footer="styles.domain.drawer.footer"
  >
    <template #header>
      <UpwTextbox
        :class="styles.domain.search"
        @update:modelValue="onSearch"
        :prependIcon="meta.showComplete ? null : 'search'"
        :placeholder="$t('domain.dac.search')"
        autofocus
        autocomplete="url"
        :model-value="query"
      />
    </template>

    <div :class="styles.domain.root">
      <UpmDomainListings
        :model-value="values"
        :items="items"
        :offset="offset"
        :loading="meta.isLoading"
        :processing="meta.isProcessing"
        @toggle="onUpdate"
      />

      <Button
        v-if="meta.showDialog && meta.hasItems && meta.hasMore"
        :label="$t('domain.dac.actions.more')"
        :loading="meta.isLoading"
        @click="onSearchOffset"
        block
        variant="ghost"
      />
    </div>

    <template #close>
      <Button
        @click="onReject"
        :label="$t('domain.dac.actions.cancel')"
        variant="link"
      />
    </template>

    <template #actions>
      <!-- <div :class="styles.domain.dialog.container"> -->

      <Button
        :loading="meta.isProcessing"
        :disabled="meta.isEmpty || meta.isDisabled || meta.isProcessing"
        @click="onResolve"
        :label="$tc('domain.dac.actions.continue', values?.length)"
        prependIcon="plus-circle"
      />
      <!-- </div> -->
    </template>
  </Drawer>
</template>

<script>
// --- external
import { computed, defineComponent } from "vue";

// --- internal
import { useStyles, cn } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { UpwTextbox, Button, Drawer } from "@upmind/upwind";
import UpmDomainListings from "./Listings.vue";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmDac",
  components: {
    Button,
    Drawer,
    UpwTextbox,
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
      showDialog:
        props.dialog &&
        !props.complete &&
        (props.loading || props.processing || !!props.items?.length),
    }));
    const styles = useStyles(["domain", "domain.drawer"], meta, config);

    return {
      styles,
      cn,
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
      debugger;
      if (this.meta.isProcessing) return;
      debugger;
      this.$emit("toggle", value);
    },
  },
});
</script>

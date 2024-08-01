<template>
  <section :class="styles.domain.listings.root">
    <header :class="styles.domain.listings.header">
      <slot name="header" v-bind="{ meta }"></slot>
    </header>

    <upw-skeleton-list
      :class="styles.domain.listings.loading"
      v-if="meta.isLoading"
    />

    <template v-else>
      <slot name="empty" v-bind="{ meta }" v-if="meta.isEmpty">
        <upm-empty />
      </slot>

      <upw-radio-list
        v-else
        :class="styles.domain.listings.items"
        :items="items"
        :model-value="modelValue"
        @update:modelValue="onUpdate"
      >
        <template #label="{ item }"> {{ item.sld }}{{ item.tld }} </template>
      </upw-radio-list>
    </template>

    <!-- <footer :class="styles.domain.listings.footer">
        <slot name="footer" v-bind="{ meta }"></slot>
      </footer> -->
  </section>
</template>

<script>
// --- external
import { computed, defineComponent } from "vue";

// --- internal
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import UpmEmpty from "./Empty.vue";
import {
  UpwButton,
  UpwSkeletonList,
  UpwRadioList,
  UpwIcon,
} from "@upmind/upwind";

// --- utils
import { get, includes, isArray, isNil } from "lodash-es";

// --- types
// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmDomainValues",
  components: {
    UpwButton,
    UpwIcon,
    UpwRadioList,
    UpwSkeletonList,
    // ---
    UpmEmpty,
  },
  emits: ["update:modelValue"],
  props: {
    i18nKey: { type: String, default: "domain.listings" },
    modelValue: { type: String },
    items: { type: Array, required: true },
    // ---
    loading: { type: Boolean, default: false },
    processing: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  setup(props) {
    debugger;
    const meta = computed(() => ({
      isLoading: props.loading,
      isEmpty: !props.items?.length,
      isDisabled: props.disabled,
      isProcessing: props.processing,
    }));
    const styles = useStyles(
      [
        "domain.listings",
        "domain.card",
        "domain.card.available",
        "domain.card.transfer",
      ],
      meta,
      config
    );

    return {
      styles,
      mergeStyles,
      meta,
      config,
    };
  },

  computed: {
    translations() {
      return this.$tm(this.i18nKey);
    },
    title() {
      return get(this.translations, "title", "Select your domain");
    },
  },
  methods: {
    onClose() {},

    isSelected(value) {
      return includes(this.modelValue, value);
    },

    onUpdate(value) {
      debugger;
      if (this.meta.isDisabled || this.meta.isProcessing) return;
      // // ensure we return a nice clean array
      this.$emit("update:modelValue", value);
    },
  },
});
</script>

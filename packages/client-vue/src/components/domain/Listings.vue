<template>
  <component
    :is="dialog ? 'upw-dialog' : 'section'"
    @reject="onClose"
    size="xl"
    title="Select domain(s)"
    :model-value="modelValue"
    @update:modelValue="onClose"
    v-show="items.length || meta.isLoading"
  >
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

        <div :class="styles.domain.listings.items" v-else>
          <template v-for="item in items" :key="item.id">
            <pre>{{ item }}</pre>

            <!-- <upm-card

            :model-value="item"
            :selected="item.id === selected?.id"
            @update:modelValue="onSelect"
            :hidden="meta.isAdding && item.id === selected?.id"
            :disabled="meta.isEditing && item.id === selected?.id"
            :i18nKey="i18nKey"
            @click:action="onClose"
          /> -->
          </template>
        </div>
      </template>

      <footer :class="styles.domain.listings.footer">
        <slot name="footer" v-bind="{ meta }"></slot>
      </footer>
    </section>
  </component>
</template>

<script>
// --- external
import { computed, defineComponent } from "vue";

// --- internal
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import UpmEmpty from "./Empty.vue";
// import UpmCard from "./Card.vue";
import {
  UpwTextbox,
  UpwButton,
  UpwSkeletonList,
  UpwDialog,
} from "@upmind/upwind";

// --- utils
import { includes, remove, uniq, compact } from "lodash-es";

// --- types
// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmDomainListings",
  components: {
    UpwTextbox,
    UpwButton,
    UpwSkeletonList,
    UpwDialog,
    // ---
    UpmEmpty,
    // UpmCard,
  },
  emits: ["update:modelValue"],
  props: {
    i18nKey: { type: String, default: "domain" },
    modelValue: { type: Array, default: () => [] },
    items: { type: Array, required: true },
    dialog: { type: Boolean, default: false },
    // ---
    loading: { type: Boolean, default: false },
    processing: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  setup(props) {
    const meta = computed(() => ({
      isLoading: props.loading,
      isEmpty: !props.items?.length,
      isDisabled: props.disabled,
      isProcessing: props.processing,
    }));
    const styles = useStyles(["domain.listings"], meta, config);

    return {
      styles,
      meta,
    };
  },

  computed: {},
  methods: {
    onClose() {},

    isSelected: value => {
      return includes(props.modelValue, value);
    },

    onChange: event => {
      if (this.meta.isDisabled || this.meta.isProcessing) return;

      const selected = this.modelValue || [];
      const checked = event.target.checked;
      const value = event.target.value;
      remove(selected, item => item == value);
      if (checked) selected.push(value);

      // ensure we return a nice clean array
      this.$emit("update:modelValue", uniq(compact(selected)));
    },
  },
});
</script>

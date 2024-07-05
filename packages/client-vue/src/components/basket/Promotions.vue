<template>
  <section :class="styles.basket.promotions.root">
    <header :class="styles.basket.promotions.header">
      <upw-button
        variant="link"
        color="secondary"
        :class="styles.basket.promotions.heading"
        @click="toggle = !toggle"
        size="sm"
        :label="$t('basket.promotions.title')"
      >
        <template #append-icon>
          <upw-icon
            icon="arrow-down"
            :class="styles.basket.promotions.toggle"
            :aria-checked="toggle"
            aria-hidden="true"
          />
        </template>
      </upw-button>
    </header>

    <upw-form
      v-show="toggle"
      size="sm"
      :class="styles.basket.promotions.content"
      :additional-errors="errors?.data"
      :loading="meta.isLoading"
      :model-value="model"
      :processing="meta.isProcessing"
      :schema="schema"
      :uischema="uischema"
      @reject="clear"
      @resolve="add"
      @update:modelValue="input"
      :actions="actions"
      :upwind-config="{ form: config.basket.promotions.form }"
    />

    <footer :class="styles.basket.promotions.footer" v-if="meta.hasPromotions">
      <h4 :class="styles.basket.promotions.title">
        {{ $t("basket.promotions.active.title") }}
      </h4>

      <upw-button
        v-for="promotion in promotions"
        :key="promotion.promotion.code"
        variant="flat"
        color="secondary"
        :label="promotion.promotion.code"
        appendIcon="close"
        @click.prevent="doRemove(promotion)"
        :disabled="meta.isProcessing"
        :loading="!!processing[promotion.id]"
        size="badge"
      />
    </footer>
  </section>
</template>

<script>
// --- external
import { defineComponent, ref } from "vue";

// --- components
import { UpwButton, UpwIcon, UpwForm } from "@upmind/upwind";

// --- internal
import { useBasketPromotions } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";
import { set } from "lodash-es";

// --- utils

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmBasketPromotions",
  components: { UpwButton, UpwIcon, UpwForm },

  emits: ["edit"],
  props: {},
  setup() {
    const {
      meta,
      errors,
      model,
      schema,
      uischema,
      promotions,
      clear,
      input,
      add,
      remove,
    } = useBasketPromotions();

    const styles = useStyles(["basket.promotions"], meta, config);

    return {
      meta,
      errors,
      model,
      schema,
      uischema,
      promotions,
      clear,
      input,
      add,
      remove,
      // ---
      config,
      styles,
      mergeStyles,
      // ---
      toggle: ref(false),
      processing: ref({}),
    };
  },
  methods: {
    doRemove(promotion) {
      set(this.processing, promotion.id, true);
      this.remove(promotion);
    },
  },
  computed: {
    actions() {
      return {
        submit: {
          type: "submit",
          label: this.$t("basket.promotions.actions.submit"),
          size: "xs",
          variant: "ghost",
          needsValid: true,
        },
      };
    },
  },
});
</script>

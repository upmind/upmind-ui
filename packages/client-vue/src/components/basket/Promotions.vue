<template>
  <section :class="styles.basket.promotions.root">
    <header :class="styles.basket.promotions.header">
      <upw-button
        variant="link"
        color="secondary"
        :class="styles.basket.promotions.heading"
        @click="toggle = !toggle"
        size="sm"
        :label="$t('basket.discount.title')"
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
      v-if="toggle"
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
    >
    </upw-form>

    <footer :class="styles.basket.promotions.footer" v-if="meta.hasPromotions">
      <h4 :class="styles.basket.promotions.title">
        {{ $t("basket.discount.active.title") }}
      </h4>

      <upw-button
        v-for="promotion in promotions"
        :key="promotion.promotion.code"
        variant="flat"
        color="secondary"
        :label="promotion.promotion.code"
        appendIcon="close"
        @click.prevent="remove(promotion)"
        :disabled="meta.isProcessing"
        size="badge"
      />
    </footer>
  </section>
</template>

<script>
// --- external
import { defineComponent, ref } from "vue";

// --- components
import { UpwButton, UpwIcon, UpwForm, UpwBadge } from "@upmind/upwind";

// --- internal
import { useBasketPromotions } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- utils

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmBasketPromotions",
  components: { UpwButton, UpwIcon, UpwForm, UpwBadge },

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
    };
  },
  methods: {},
  computed: {
    actions() {
      return {
        submit: {
          type: "submit",
          label: this.$t("basket.discount.actions.submit"),
          size: "sm",
          variant: "ghost",
          color: "secondary",
          disabled:
            !this.meta.isDirty || !this.meta.isValid || this.meta.isProcessing,
        },
      };
    },
  },
});
</script>

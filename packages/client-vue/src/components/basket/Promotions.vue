<template>
  <section :class="styles.basket.promotions.root" v-auto-animate>
    <header :class="styles.basket.promotions.header">
      <uw-button
        variant="link"
        :class="styles.basket.promotions.heading"
        @click="toggle = !toggle"
        size="sm"
        :label="$t('basket.promotions.title')"
      >
        <upw-icon
          slot="append"
          icon="arrow-down"
          :class="styles.basket.promotions.toggle"
          :aria-checked="toggle"
          aria-hidden="true"
        />
      </uw-button>
    </header>

    <upw-form
      v-if="toggle"
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

    <footer
      :class="styles.basket.promotions.footer"
      v-if="meta.hasPromotions"
      v-auto-animate
    >
      <h4 :class="styles.basket.promotions.title">
        {{ $t("basket.promotions.active.title") }}
      </h4>

      <uw-button
        v-for="promotion in promotions"
        :key="promotion.promotion.code"
        variant="flat"
        color="promotion"
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
import { vAutoAnimate } from "@formkit/auto-animate";

// --- components
import { UpwIcon, UpwForm } from "@upmind/upwind";

// --- custom elements
import { UwButton, useCustomElement } from "@upmind/upwind";
useCustomElement(UwButton);

// --- internal
import { useBasketPromotions } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";
import { set } from "lodash-es";

// --- utils

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmBasketPromotions",
  components: { UpwIcon, UpwForm },
  directives: { autoAnimate: vAutoAnimate },
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
          size: "sm",
          variant: "ghost",
          needsValid: true,
        },
      };
    },
  },
});
</script>

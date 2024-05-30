<template>
  <upw-input
    v-if="hasBillingCycle"
    :class="styles.product.config.terms.root"
    :label="$t('product.terms.label')"
    :disabled="disabled"
    :required="true"
    no-required
    no-feedback
    no-status
    variant="flat"
    layout="stacked"
  >
    <h-radio-group
      :model-value="modelValue"
      @update:model-value="doResolve"
      as="ul"
      :class="styles.product.config.terms.items"
    >
      <h-radio-group-option
        as="template"
        v-for="term in terms"
        :key="term.billing_cycle_months"
        :value="term.billing_cycle_months"
        v-slot="{ checked }"
      >
        <li
          :class="
            mergeStyles(
              styles.product.config.term.root,
              checked ? styles.product.config.term.selected : null
            )
          "
        >
          <upw-radio
            :class="styles.product.config.term.input"
            :model-value="checked"
            :value="term.billing_cycle_months"
            no-feedback
            no-status
            variant="flat"
          />

          <div :class="styles.product.config.term.header">
            <h4 :class="styles.product.config.term.title">
              {{ term.billing_cycle_name }}
            </h4>

            <upw-badge
              v-if="term.saving"
              color="primary"
              :label="$t('product.terms.save', term)"
            />

            <!-- monthly -->
            <span
              :class="styles.product.config.term.text"
              v-if="term?.monthly_price_from && term.billing_cycle_months > 1"
            >
              {{
                $t("product.terms.cycle", {
                  value: term?.monthly_price_from_discounted
                    ? term.monthly_price_from_discounted_formatted
                    : term.monthly_price_from_formatted,
                })
              }}
            </span>
          </div>

          <div :class="styles.product.config.term.footer">
            <strong :class="styles.product.config.term.total">
              {{
                term?.price_discounted
                  ? term.price_discounted_formatted
                  : term?.price
                    ? term.price_formatted
                    : $t("product.free")
              }}
            </strong>

            <span
              :class="styles.product.config.term.discount"
              v-if="term?.price_discounted"
            >
              {{ term.price_formatted }}
            </span>
          </div>
        </li>
      </h-radio-group-option>
    </h-radio-group>
  </upw-input>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";

// --- internal
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { RadioGroup, RadioGroupOption } from "@headlessui/vue";
import { UpwRadio, UpwBadge, UpwInput } from "@upmind/upwind";

// --- utils
import { isEqual, isNil } from "lodash-es";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmProductConfigTerms",
  components: {
    UpwInput,
    UpwRadio,
    UpwBadge,
    HRadioGroup: RadioGroup,
    HRadioGroupOption: RadioGroupOption,
  },
  emits: ["update:modelValue"],
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    terms: {
      type: Array,
      required: true,
    },
    modelValue: {
      type: Number,
      required: true,
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup(props) {
    const styles = useStyles(
      ["product.config.terms", "product.config.term"],
      toRefs(props),
      config
    );

    return {
      styles,
      mergeStyles,
      isSelected: term => isEqual(term.billing_cycle_months, props.modelValue),
    };
  },
  computed: {
    hasBillingCycle() {
      return !isNil(this.modelValue) && this.terms?.length > 1;
    },
  },
  methods: {
    doResolve(term) {
      if (this.disabled) return;

      this.$emit("update:modelValue", term);
    },
  },
});
</script>

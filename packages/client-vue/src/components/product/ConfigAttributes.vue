<template>
  <upw-input
    v-for="attribute in attributes"
    :key="attribute.id"
    :class="styles.product.config.attributes.root"
    :label="attribute.name"
    :disabled="disabled"
    :required="true"
    no-required
    no-feedback
    no-status
    variant="flat"
    layout="stacked"
  >
    <ul :class="styles.product.config.attributes.items">
      <li v-for="value in attribute.values" :key="value.id">
        <label
          :for="`attributes[${attribute.id}][${value.id}]`"
          :class="
            mergeStyles(
              styles.product.config.attribute.root,
              isSelected(attribute.id, value.id)
                ? styles.product.config.attribute.selected
                : null
            )
          "
        >
          <component
            :is="attribute.multiple ? 'upw-checkbox' : 'upw-radio'"
            :id="`attributes[${attribute.id}][${value.id}]`"
            :name="`attributes[${attribute.id}]`"
            :class="styles.product.config.attribute.input"
            :model-value="isSelected(attribute.id, value.id)"
            :value="value.id"
            :required="attribute.required"
            @change="doResolve(attribute, value.id, $event)"
            no-feedback
            no-status
            variant="flat"
          />

          <div :class="styles.product.config.attribute.header">
            <h4 :class="styles.product.config.attribute.title">
              {{ value.name }}
            </h4>

            <upw-badge
              v-if="value.saving"
              color="primary"
              :label="$t('product.attributes.save', value)"
            />

            <!-- monthly -->
            <span
              :class="styles.product.config.attribute.text"
              v-if="value?.monthly_price_from && value.billing_cycle_months > 1"
            >
              {{
                $t("product.attributes.cycle", {
                  value: value?.monthly_price_from_discounted
                    ? value.monthly_price_from_discounted_formatted
                    : value.monthly_price_from_formatted,
                })
              }}
            </span>
          </div>

          <div
            :class="styles.product.config.attribute.footer"
            v-if="value?.price"
          >
            <strong :class="styles.product.config.attribute.total">
              {{
                value?.price_discounted
                  ? value.price_discounted_formatted
                  : value?.price
                    ? value.price_formatted
                    : ""
              }}
            </strong>

            <span
              :class="styles.product.config.attribute.discount"
              v-if="value?.price_discounted"
            >
              {{ value.price_formatted }}
            </span>
          </div>
        </label>
      </li>
    </ul>
  </upw-input>
</template>

<script>
// --- external
import { defineComponent, toRefs } from "vue";

// --- internal
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { UpwRadio, UpwCheckbox, UpwBadge, UpwInput } from "@upmind/upwind";

// --- utils
import { isNil, some } from "lodash-es";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmProductConfigAttributes",
  components: {
    UpwInput,
    UpwRadio,
    UpwCheckbox,
    UpwBadge,
  },
  emits: [
    "update:modelValue",
    "update:quantity:increment",
    "update:quantity:decrement",
  ],
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    attributes: {
      type: Array,
      default: () => [],
      required: true,
    },
    modelValue: {
      type: Object,
      required: true,
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup(props) {
    const styles = useStyles(
      ["product.config.attributes", "product.config.attribute"],
      toRefs(props),
      config
    );

    return {
      styles,
      mergeStyles,
    };
  },
  computed: {
    has() {
      return !isNil(this.modelValue) && this.attributes?.length > 1;
    },
  },
  methods: {
    isSelected(attributeId, value) {
      return some(this.modelValue?.[attributeId], ["product_id", value]);
    },
    doResolve(attribute, value, $event) {
      if (this.disabled || this.processing) return;

      this.$emit("update:modelValue", attribute, value, $event);
    },
  },
});
</script>

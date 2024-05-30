<template>
  <upw-input
    v-for="item in items"
    :key="item.id"
    :class="styles.product.config.list.root"
    :label="item.name"
    :disabled="disabled"
    :required="true"
    no-required
    no-feedback
    no-status
    variant="flat"
    layout="stacked"
  >
    <ul :class="styles.product.config.list.items">
      <li v-for="value in item.values" :key="value.id">
        <label
          :for="`items[${item.id}][${value.id}]`"
          :class="
            mergeStyles(
              styles.product.config.list.item.root,
              isSelected(item.id, value.id)
                ? styles.product.config.list.item.selected
                : null
            )
          "
        >
          <component
            :is="item.multiple ? 'upw-checkbox' : 'upw-radio'"
            :id="`items[${item.id}][${value.id}]`"
            :name="`items[${item.id}]`"
            :class="styles.product.config.list.item.input"
            :model-value="isSelected(item.id, value.id)"
            :value="value.id"
            :required="item.required"
            @change="doResolve(item, value.id, $event)"
            no-feedback
            no-status
            variant="flat"
          />

          <!-- content -->
          <div :class="styles.product.config.list.item.header">
            <h4 :class="styles.product.config.list.item.title">
              {{ value.name }}
            </h4>

            <upw-badge
              v-if="value.saving"
              color="primary"
              :label="$t('product.items.save', value)"
            />

            <!-- monthly -->
            <span
              :class="styles.product.config.list.item.text"
              v-if="value?.monthly_price_from && value.billing_cycle_months > 1"
            >
              {{
                $t("product.items.cycle", {
                  value: value?.monthly_price_from_discounted
                    ? value.monthly_price_from_discounted_formatted
                    : value.monthly_price_from_formatted,
                })
              }}
            </span>
          </div>

          <!-- price / qty -->
          <div
            :class="styles.product.config.list.item.footer"
            v-if="value?.price"
          >
            <strong :class="styles.product.config.list.item.total">
              {{
                value.price?.price_discounted
                  ? value.price.price_discounted_formatted
                  : value.price.price_formatted
              }}
            </strong>

            <span
              :class="styles.product.config.list.item.discount"
              v-if="value.price?.price_discounted"
            >
              {{ value.price.price_formatted }}
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
  name: "UpmProductConfigList",
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
    items: {
      type: Array,
      default: () => [],
      required: true,
    },
    modelValue: {
      type: Object,
      required: true,
    },
    itemKey: {
      type: String,
      required: true,
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup(props) {
    const styles = useStyles(
      ["product.config.list", "product.config.list.item"],
      toRefs(props),
      config
    );

    return {
      styles,
      mergeStyles,
    };
  },
  computed: {},
  methods: {
    isSelected(itemId, value) {
      return some(this.modelValue?.[itemId], [this.itemKey, value]);
    },
    doResolve(item, value, $event) {
      if (this.disabled || this.processing) return;

      this.$emit("update:modelValue", item, value, $event);
    },
  },
});
</script>

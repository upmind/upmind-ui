<template>
  <upw-input
    v-for="item in items"
    :key="item.id"
    :class="styles.product.config.list.root"
    :label="item.name"
    :required="true"
    no-required
    no-feedback
    no-status
    variant="flat"
    layout="stacked"
  >
    <ul :class="styles.product.config.list.items">
      <li
        v-for="value in item.values"
        :key="value.id"
        :aria-selected="
          isSelected(
            item.id,
            value.id,
            item.values?.length == 1 && item.required
          )
        "
        :class="
          mergeStyles(
            styles.product.config.list.item.root,
            isSelected(
              item.id,
              value.id,
              item.values?.length == 1 && item.required
            )
              ? styles.product.config.list.item.selected
              : null
          )
        "
      >
        <label
          :for="`items[${item.id}][${value.id}]`"
          :class="styles.product.config.list.item.wrapper"
          :disabled="disabled"
        >
          <component
            :is="
              item.multiple || item.values?.length == 1
                ? 'upw-checkbox'
                : 'upw-radio'
            "
            :id="`items[${item.id}][${value.id}]`"
            :name="`items[${item.id}]`"
            :class="styles.product.config.list.item.input"
            :model-value="
              isSelected(
                item.id,
                value.id,
                item.values?.length == 1 && item.required
              )
            "
            :value="value.id"
            :required="item.required"
            :disabled="disabled"
            :processing="processing"
            @change="doResolve(item, value, $event)"
            no-feedback
            no-status
            variant="flat"
            size="md"
          />

          <!-- content -->
          <div :class="styles.product.config.list.item.header">
            <span :class="styles.product.config.list.item.title">
              {{ value.name }}
            </span>

            <upw-badge
              v-if="value.saving"
              color="secondary"
              :label="$t('product.save', { value: item.saving_formatted })"
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

          <!-- footer -->
          <div
            :class="styles.product.config.list.item.footer"
            v-if="value?.price"
          >
            <upw-spinner v-if="loading" size="xs" />

            <upw-quantitybox
              v-if="
                value.canChangeQuantity && modelValue?.[item.id]?.[value.id]
              "
              :disabled="processing"
              :min="value?.min_order_quantity"
              :max="value?.max_order_quantity"
              :step="value?.unit_quantity"
              :model-value="
                modelValue[item.id][value.id]?.unit_quantity ||
                value?.unit_quantity
              "
              @update:modelValue="doUpdateQuantity(item, value, $event)"
              size="sm"
            />

            <span :class="styles.product.config.list.item.price">
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
import {
  UpwRadio,
  UpwCheckbox,
  UpwBadge,
  UpwInput,
  UpwQuantitybox,
  UpwSpinner,
} from "@upmind/upwind";

// --- utils
import { some } from "lodash-es";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmProductConfigList",
  components: {
    UpwInput,
    UpwRadio,
    UpwCheckbox,
    UpwBadge,
    UpwQuantitybox,
    UpwSpinner,
  },
  emits: ["update:modelValue", "update:quantity"],
  props: {
    disabled: { type: Boolean },
    loading: { type: Boolean },
    processing: { type: Boolean },
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
    isSelected(item, value, autoselect = false) {
      return autoselect || some(this.modelValue?.[item], [this.itemKey, value]);
    },

    doUpdateQuantity(item, value, $event) {
      this.$emit("update:quantity", item, value, $event);
    },

    doResolve(item, value, $event) {
      if (this.disabled || this.processing) return;

      this.$emit("update:modelValue", item, value, $event);
    },
  },
});
</script>

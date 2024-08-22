<template>
  <upw-input
    v-for="item in items"
    :key="item.id"
    :class="styles.product.config.list.root"
    :label="item.name"
    :text="safeText(item)"
    :required="item.required"
    :errors="safeErrors(item.id)"
    variant="flat"
    layout="stacked"
    :dirty="isDirty(item.id)"
    @blur="blurred[item.id] = true"
    tabindex="-1"
  >
    <ul
      :class="styles.product.config.list.items"
      :aria-invalid="isInvalid(item.id)"
    >
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
        :class="styles.product.config.list.item.root"
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
            <!-- title -->
            <span :class="styles.product.config.list.item.title">
              {{ value.name }}
            </span>
            <!-- badges -->
            <span :class="styles.product.config.list.item.badges">
              <template
                v-for="promotion in value?.price?.promotions"
                :key="promotion.id"
              >
                <upw-badge
                  color="promotion"
                  :label="
                    $tc(
                      'product.promo_save',
                      promotion.mixed || !promotion.amount ? 1 : 0,
                      {
                        value: promotion.amount_formatted,
                      }
                    )
                  "
                />
              </template>

              <!-- <upw-badge
                v-if="!item.price_override"
                variant="tonal"
                color="base"
                :label="value.price?.billing_cycle_name"
              /> -->
            </span>
          </div>

          <!-- footer -->
          <div :class="styles.product.config.list.item.footer">
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
              <strong
                :class="styles.product.config.list.item.total"
                v-if="value.price"
              >
                <span v-if="!item.price_override && value.price?.price">+</span>

                {{
                  value.price?.price_discounted
                    ? value.price?.price_discounted_formatted
                    : value.price.price
                      ? value.price?.price_formatted
                      : $t("product.free")
                }}
              </strong>

              <span
                :class="styles.product.config.list.item.discount"
                v-if="value.price?.price_discounted"
              >
                {{ value.price?.price_formatted }}
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
import { defineComponent, toRefs, ref } from "vue";

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
import { some, has } from "lodash-es";

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
    errors: {
      type: Object,
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
      blurred: ref({}),
    };
  },
  computed: {},
  methods: {
    safeText(item) {
      const hasPrices = this.hasPrices(item);

      if (hasPrices && item?.price_override) {
        return this.$tc("product.adds_overrides", item?.price_override ? 1 : 0);
      }

      return null;
    },

    isDirty(item) {
      return has(this.blurred, item);
    },

    safeErrors(item) {
      return this.errors?.[item]?.join() || undefined;
    },

    hasPrices(item) {
      return some(item.values, "price");
    },

    isInvalid(item) {
      return this.isDirty(item) && !!this.errors?.[item]?.length;
    },

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

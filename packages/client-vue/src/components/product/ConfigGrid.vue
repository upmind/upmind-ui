<template>
  <upw-input
    v-if="hasItems"
    :class="styles.product.config.grid.root"
    :label="label"
    :required="true"
    :errors="errors"
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
      :class="styles.product.config.grid.items"
    >
      <h-radio-group-option
        as="template"
        v-for="(item, index) in items"
        :key="`item-${index}`"
        :value="item[itemKey]"
        v-slot="{ checked }"
      >
        <li
          :class="
            mergeStyles(
              styles.product.config.grid.item.root,
              disabled ? styles.product.config.grid.item.disabled : null,
              checked ? styles.product.config.grid.item.selected : null
            )
          "
        >
          <upw-radio
            :class="styles.product.config.grid.item.input"
            :model-value="checked"
            no-feedback
            no-status
            variant="flat"
            no-label
          />

          <div :class="styles.product.config.grid.item.header">
            <span :class="styles.product.config.grid.item.title">
              {{ item.billing_cycle_name }}
            </span>

            <template v-for="promotion in item?.promotions" :key="promotion.id">
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

            <!-- monthly -->
            <span
              :class="styles.product.config.grid.item.text"
              v-if="item?.monthly_price_from && item.billing_cycle_months > 1"
            >
              {{
                $t("product.cycle", {
                  value: item?.monthly_price_from_discounted
                    ? item.monthly_price_from_discounted_formatted
                    : item.monthly_price_from_formatted,
                })
              }}
            </span>
          </div>

          <div :class="styles.product.config.grid.item.footer">
            <strong :class="styles.product.config.grid.item.total">
              {{
                item?.price_discounted
                  ? item.price_discounted_formatted
                  : item?.price
                    ? item.price_formatted
                    : $t("product.free")
              }}
            </strong>

            <span
              :class="styles.product.config.grid.item.discount"
              v-if="item?.price_discounted"
            >
              {{ item.price_formatted }}
            </span>
          </div>
        </li>
      </h-radio-group-option>
    </h-radio-group>
  </upw-input>

  <pre v-if="errors">{{ errors }}</pre>
</template>

<script>
// --- external
import { defineComponent, toRefs } from "vue";

// --- internal
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { RadioGroup, RadioGroupOption } from "@headlessui/vue";
import { UpwRadio, UpwBadge, UpwInput } from "@upmind/upwind";

// --- utils
import { isNil } from "lodash-es";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmProductConfigGrid",
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
    loading: {
      type: Boolean,
      default: false,
    },
    processing: {
      type: Boolean,
      default: false,
    },
    items: {
      type: Array,
      required: true,
    },
    modelValue: {
      type: Number,
      required: true,
    },
    itemKey: {
      type: String,
      required: true,
    },
    label: {
      type: String,
    },
    errors: {
      type: Array,
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup(props) {
    const styles = useStyles(
      ["product.config.grid", "product.config.grid.item"],
      toRefs(props),
      config
    );

    return {
      styles,
      mergeStyles,
    };
  },
  computed: {
    hasItems() {
      return !isNil(this.modelValue) && this.items?.length > 1;
    },
  },
  methods: {
    doResolve(item) {
      if (this.disabled) return;

      this.$emit("update:modelValue", item);
    },
  },
});
</script>

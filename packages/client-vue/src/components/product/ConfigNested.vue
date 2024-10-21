<template>
  <template v-for="item in items" :key="item.id">
    <UpwInput
      v-if="item.values?.length"
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
      <component
        :is="
          item.multiple || item.values?.length == 1
            ? 'upw-checkbox-list'
            : 'upw-radio-list'
        "
        :items="parsedValues(item.values)"
        :model-value="getValues(item)"
        :errors="errors?.[item.id]"
        no-feedback
        @update:modelValue="doResolve(item, $event)"
      >
        <template #prepend="{ item: value }"> </template>

        <template #label="{ item: value }">
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
                <Badge
                  color="promotion"
                  :label="
                    t(
                      'product.promo_save',
                      promotion.mixed || !promotion.amount ? 1 : 0,
                      {
                        value: promotion.amount_formatted,
                      }
                    )
                  "
                />
              </template>
            </span>
          </div>
        </template>

        <template #append="{ item: value }">
          <div :class="styles.product.config.list.item.footer">
            <Spinner v-if="loading" size="xs" />

            <UpwQuantitybox
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
                      : t("product.free")
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
        </template>
      </component>
    </UpwInput>
  </template>
</template>

<script>
// --- external
import { defineComponent, toRefs, ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles, cn } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import {
  UpwRadio,
  UpwRadioList,
  UpwCheckbox,
  UpwCheckboxList,
  UpwInput,
  UpwQuantitybox,
  Spinner,
} from "@upmind/upwind";

// --- custom elements
import { Badge } from "@upmind/upwind";

// --- utils
import { some, has, reduce, map, get, first, isArray } from "lodash-es";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmProductConfigNested",
  components: {
    Badge,
    UpwInput,
    UpwRadio,
    UpwRadioList,
    UpwCheckbox,
    UpwCheckboxList,
    UpwQuantitybox,
    Spinner,
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
    const { t } = useI18n();

    const styles = useStyles(
      ["product.config.list", "product.config.list.item"],
      toRefs(props),
      config
    );

    return {
      t,
      styles,
      cn,
      blurred: ref({}),
    };
  },
  computed: {},
  methods: {
    safeText(item) {
      const hasPrices = this.hasPrices(item);

      if (hasPrices && item?.price_override) {
        return this.t("product.adds_overrides", item?.price_override ? 1 : 0);
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

    safeValue(item, value) {
      const shouldBeArray = item.multiple || item.values?.length == 1;
      const safeArray = !isArray(value) ? [value] : value;
      const safeString = isArray(value) ? first(value) : value;
      const safeValue = shouldBeArray ? safeArray : safeString;
      return safeValue;
    },

    getValues(item) {
      const value = reduce(
        this.modelValue?.[item.id],
        (result, value) => {
          const val = get(value, this.itemKey);
          if (val) result.push(val);
          return result;
        },
        []
      );

      return this.safeValue(item, value);
    },

    doUpdateQuantity(item, value, $event) {
      this.$emit("update:quantity", item, value, $event);
    },

    doResolve(item, value) {
      if (this.disabled || this.processing) return;

      const safeValue = this.safeValue(item, value);

      this.$emit("update:modelValue", item, safeValue);
    },

    parsedValues(values) {
      return map(values, value => ({
        ...value,
        value: value.id,
        label: value.name,
      }));
    },
  },
});
</script>

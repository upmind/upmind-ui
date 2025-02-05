<template>
  <UpwInput
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
    <HRadioGroup
      :model-value="modelValue"
      @update:model-value="doResolve"
      as="ul"
      :class="styles.product.config.grid.items"
    >
      <HRadioGroupOption
        as="template"
        v-for="(item, index) in items"
        :key="`item-${index}`"
        :value="item[itemKey]"
        v-slot="{ checked }"
      >
        <li
          :class="
            cn(
              styles.product.config.grid.item.root,
              disabled ? styles.product.config.grid.item.disabled : null,
              checked ? styles.product.config.grid.item.selected : null
            )
          "
        >
          <UpwRadio
            :class="styles.product.config.grid.item.input"
            :model-value="checked"
            no-feedback
            no-status
            variant="flat"
            no-label
          />

          <div :class="styles.product.config.grid.item.header">
            <span :class="styles.product.config.grid.item.title">
              {{ item.name }}
            </span>

            <template v-for="promotion in item?.promotions" :key="promotion.id">
              <Badge color="promotion" variant="tonal">
                {{
                  promotion.mixed || !promotion.amount
                    ? t("product.promotion")
                    : t("product.promotion_save", {
                        value: promotion.amountFormatted,
                      })
                }}
              </Badge>
            </template>

            <!-- monthly -->
            <span
              :class="styles.product.config.grid.item.text"
              v-if="item?.monthlyFromCurrentPrice && item.term > 1"
            >
              {{
                t("product.cycle", {
                  value: item?.monthlyFromCurrentPrice,
                })
              }}
            </span>
          </div>

          <div :class="styles.product.config.grid.item.footer">
            <span
              :class="styles.product.config.grid.item.discount"
              v-if="item?.meta.discounted"
            >
              {{ item.regularPrice }}
            </span>
            <strong :class="styles.product.config.grid.item.total">
              {{ item?.meta.free ? t("product.free") : item.currentPrice }}
            </strong>
          </div>
        </li>
      </HRadioGroupOption>
    </HRadioGroup>
  </UpwInput>

  <!-- <pre v-if="errors">{{ errors }}</pre> -->
</template>

<script>
// --- external
import { defineComponent, toRefs } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles, cn } from "@upmind-automation/upmind-ui";
import config from "./config.cva";

// --- components
import { RadioGroup, RadioGroupOption } from "@headlessui/vue";
import { UpwRadio, UpwInput } from "@upmind-automation/upmind-ui";

// --- custom elements
import { Badge } from "@upmind-automation/upmind-ui";

// --- utils
import { isNil } from "lodash-es";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "ProductConfigGrid",
  components: {
    Badge,
    UpwInput,
    UpwRadio,
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
    const { t } = useI18n();

    const styles = useStyles(
      ["product.config.grid", "product.config.grid.item"],
      toRefs(props),
      config
    );

    return {
      t,
      styles,
      cn,
    };
  },
  computed: {
    hasItems() {
      return !isNil(this.modelValue) && !!this.items?.length;
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

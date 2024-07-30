<template>
  <component
    :is="dialog ? 'upw-dialog' : 'div'"
    size="2xl"
    :title="title"
    :model-value="!!items.length || meta.isLoading"
    @reject="onClose"
    @update:modelValue="onClose"
    v-show="!!items.length || meta.isLoading"
  >
    <section :class="styles.domain.listings.root">
      <header :class="styles.domain.listings.header">
        <slot name="header" v-bind="{ meta }"></slot>
      </header>

      <upw-skeleton-list
        :class="styles.domain.listings.loading"
        v-if="meta.isLoading"
      />

      <template v-else>
        <slot name="empty" v-bind="{ meta }" v-if="meta.isEmpty">
          <upm-empty />
        </slot>

        <component
          v-else
          :is="multiple ? 'upw-checkbox-list' : 'upw-radio-list'"
          :class="styles.domain.listings.items"
          :items="items"
          :model-value="safeValue"
          @update:modelValue="onChange"
          no-input
        >
          <template #prepend="{ item }"> </template>

          <template #label="{ item }">
            <p :class="styles.domain.card.label">
              <span :class="styles.domain.card.text" v-if="!item.is_available">
                <upw-icon
                  icon="transfer-circle-solid"
                  :class="styles.domain.card.transfer.label"
                />

                {{ $t("domain.card.transfer.label") }}
              </span>
              <span v-else :class="styles.domain.card.text">
                <upw-icon
                  icon="check-circle-solid"
                  :class="styles.domain.card.available.label"
                />
                {{ $t("domain.card.available.label") }}
              </span>

              <span :class="styles.domain.card.title">
                {{ item.sld
                }}<strong :class="styles.domain.card.underline">{{
                  item.tld
                }}</strong>
              </span>
            </p>
          </template>

          <template #append="{ item }">
            <div :class="styles.domain.card.footer">
              <i18n-t
                v-if="!item.is_available"
                :class="styles.domain.card.transfer.root"
                keypath="domain.card.transfer.instruction"
                tag="p"
              >
                <template #[`newline`]><br /></template>

                <template #[`ownership`]>
                  <strong :class="styles.domain.card.transfer.ownership">{{
                    $t("domain.card.transfer.ownership")
                  }}</strong>
                </template>

                <template #[`price`]>
                  <em :class="styles.domain.card.transfer.price">{{
                    item.price_formatted
                  }}</em>
                </template>

                <template #[`tld`]>
                  <em :class="styles.domain.card.transfer.tld">{{
                    item.tld
                  }}</em>
                </template>
              </i18n-t>

              <i18n-t
                v-else
                :class="styles.domain.card.available.root"
                keypath="domain.card.available.instruction"
                tag="p"
              >
                <template #[`newline`]><br /></template>

                <template #[`ownership`]>
                  <strong :class="styles.domain.card.available.ownership">{{
                    $t("domain.card.available.ownership")
                  }}</strong>
                </template>

                <template #[`price`]>
                  <em :class="styles.domain.card.available.price">{{
                    item.price_formatted
                  }}</em>
                </template>

                <template #[`tld`]>
                  <em :class="styles.domain.card.available.tld">{{
                    item.tld
                  }}</em>
                </template>
              </i18n-t>

              <div :class="styles.domain.card.actions">
                <upw-button
                  v-if="item.is_available"
                  :class="styles.domain.card.available.action"
                  :disabled="meta.isDisabled"
                  :label="
                    $tc(
                      'domain.card.available.action',
                      isSelected(item.domain) ? 0 : 1
                    )
                  "
                  :loading="meta.isProcessing"
                  :prepend-icon="
                    isSelected(item.domain) ? 'check' : 'plus-circle'
                  "
                  :variant="isSelected(item.domain) ? 'flat' : 'outlined'"
                  @click="onChange(item)"
                  block
                  size="sm"
                />

                <upw-button
                  v-else
                  :class="styles.domain.card.transfer.action"
                  :disabled="meta.isDisabled"
                  :label="
                    $tc(
                      'domain.card.transfer.action',
                      isSelected(item.domain) ? 0 : 1
                    )
                  "
                  :loading="meta.isProcessing"
                  :prepend-icon="isSelected(item.domain) ? 'check' : 'transfer'"
                  :variant="isSelected(item.domain) ? 'flat' : 'outlined'"
                  @click="onChange(item)"
                  block
                  size="sm"
                />
              </div>
            </div>
          </template>
        </component>
      </template>

      <!-- <footer :class="styles.domain.listings.footer">
        <slot name="footer" v-bind="{ meta }"></slot>
      </footer> -->
    </section>
  </component>
</template>

<script>
// --- external
import { computed, defineComponent } from "vue";

// --- internal
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import UpmEmpty from "./Empty.vue";
import UpmCard from "./Card.vue";
import {
  UpwTextbox,
  UpwButton,
  UpwSkeletonList,
  UpwDialog,
  UpwCheckboxList,
  UpwRadioList,
  UpwIcon,
} from "@upmind/upwind";

// --- utils
import {
  compact,
  first,
  get,
  includes,
  isArray,
  isObject,
  isString,
  remove,
  uniq,
} from "lodash-es";

// --- types
// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmDomainListings",
  components: {
    UpwTextbox,
    UpwButton,
    UpwIcon,
    UpwCheckboxList,
    UpwRadioList,
    UpwSkeletonList,
    UpwDialog,
    // ---
    UpmEmpty,
    UpmCard,
  },
  emits: ["update:modelValue"],
  props: {
    i18nKey: { type: String, default: "domain.listings" },
    modelValue: { type: [String, Array], default: () => [] },
    items: { type: Array, required: true },
    dialog: { type: Boolean, default: false },
    multiple: { type: Boolean, default: false },
    // ---
    loading: { type: Boolean, default: false },
    processing: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  setup(props) {
    const meta = computed(() => ({
      isLoading: props.loading,
      isEmpty: !props.items?.length,
      isDisabled: props.disabled,
      isProcessing: props.processing,
    }));
    const styles = useStyles(
      [
        "domain.listings",
        "domain.card",
        "domain.card.available",
        "domain.card.transfer",
      ],
      meta,
      config
    );

    return {
      styles,
      mergeStyles,
      meta,
      config,
    };
  },

  computed: {
    translations() {
      return this.$tm(this.i18nKey);
    },
    title() {
      return get(this.translations, "title", "Select your domain");
    },
    safeValue() {
      return this.multiple ? this.modelValue : first(this.modelValue);
    },
  },
  methods: {
    onClose() {},

    isSelected(value) {
      return includes(this.modelValue, value);
    },

    onChange(value) {
      if (this.meta.isDisabled || this.meta.isProcessing) return;
      // ensure we return a nice clean array

      if (isArray(value) && !this.multiple) {
        value = first(value);
      } else if (isArray(value) && this.multiple) {
        value = value.map(item => (isObject(item) ? item.domain : item));
      } else if (isString(value) || (isObject(value) && this.multiple)) {
        const selected = this.modelValue || [];
        value = isObject(value) ? value.domain : value;
        if (includes(selected, value)) {
          remove(selected, domain => domain == value);
        } else {
          selected.push(value);
        }
        // ensure we return a nice clean array
        value = uniq(compact(selected));
      }

      this.$emit("update:modelValue", value);
    },
  },
});
</script>

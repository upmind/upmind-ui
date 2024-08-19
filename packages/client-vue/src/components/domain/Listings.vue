<template>
  <component
    :is="dialog ? 'upw-dialog' : 'div'"
    size="2xl"
    :title="title"
    :model-value="!!items.length || meta.isLoading"
    v-show="!!items.length || meta.isLoading"
  >
    <section :class="styles.domain.listings.root">
      <header :class="styles.domain.listings.header">
        <slot name="header" v-bind="{ meta }"></slot>
      </header>

      <transition
        :enter-active-class="styles.domain.transitions.fade.enter.active"
        :enter-from-class="styles.domain.transitions.fade.enter.from"
        :enter-to-class="styles.domain.transitions.fade.enter.to"
        :leave-active-class="styles.domain.transitions.fade.leave.active"
        :leave-from-class="styles.domain.transitions.fade.leave.from"
        :leave-to-class="styles.domain.transitions.fade.leave.to"
      >
        <upw-skeleton-list
          :class="styles.domain.listings.loading"
          v-if="meta.isLoading"
          :rows="3"
        />

        <slot name="empty" v-bind="{ meta }" v-else-if="meta.isEmpty">
          <upm-empty />
        </slot>

        <upw-checkbox-list
          v-else
          :class="styles.domain.listings.items"
          :items="items"
          :model-value="safeValue"
          no-input
        >
          <template #prepend="{ item }"> </template>

          <template #label="{ item }">
            <p :class="styles.domain.card.label">
              <span :class="styles.domain.card.text" v-if="item.is_owned">
                <upw-icon icon="lock" :class="styles.domain.card.owned.label" />

                {{ $t("domain.card.owned.label") }}
              </span>

              <span :class="styles.domain.card.text" v-else-if="item.in_basket">
                <upw-icon
                  icon="check-circle-solid"
                  :class="styles.domain.card.basket.label"
                />

                {{ $t("domain.card.basket.label") }}
              </span>

              <span
                v-else-if="item.is_available"
                :class="styles.domain.card.text"
              >
                <upw-icon
                  icon="check-circle-solid"
                  :class="styles.domain.card.available.label"
                />
                {{ $t("domain.card.available.label") }}
              </span>

              <span :class="styles.domain.card.text" v-else>
                <upw-icon
                  icon="transfer-circle-solid"
                  :class="styles.domain.card.transfer.label"
                />

                {{ $t("domain.card.transfer.label") }}
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
                v-if="item.is_owned"
                :class="styles.domain.card.owned.root"
                keypath="domain.card.owned.instruction"
                tag="p"
              >
                <template #[`newline`]><br /></template>

                <template #[`ownership`]>
                  <strong :class="styles.domain.card.owned.ownership">{{
                    $t("domain.card.owned.ownership")
                  }}</strong>
                </template>

                <template #[`price`]>
                  <em :class="styles.domain.card.owned.price">{{
                    item.price_formatted
                  }}</em>
                </template>

                <template #[`tld`]>
                  <em :class="styles.domain.card.owned.tld">{{ item.tld }}</em>
                </template>
              </i18n-t>

              <i18n-t
                v-else-if="item.in_basket"
                :class="styles.domain.card.basket.root"
                keypath="domain.card.basket.instruction"
                tag="p"
              >
                <template #[`newline`]><br /></template>

                <template #[`ownership`]>
                  <strong :class="styles.domain.card.basket.ownership">{{
                    $t("domain.card.basket.ownership")
                  }}</strong>
                </template>

                <template #[`price`]>
                  <em :class="styles.domain.card.basket.price">{{
                    item.price_formatted
                  }}</em>
                </template>

                <template #[`tld`]>
                  <em :class="styles.domain.card.basket.tld">{{ item.tld }}</em>
                </template>
              </i18n-t>

              <i18n-t
                v-else-if="item.is_available"
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

              <i18n-t
                v-else
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

              <div :class="styles.domain.card.actions">
                <upw-button
                  v-if="item.is_owned"
                  :class="styles.domain.card.owned.action"
                  :label="$t('domain.card.owned.action')"
                  disabled
                  prepend-icon="check"
                  variant="flat"
                  block
                  size="sm"
                />

                <upw-button
                  v-else-if="item.in_basket"
                  :class="styles.domain.card.basket.action"
                  :label="$t('domain.card.basket.action')"
                  disabled
                  prepend-icon="check"
                  variant="flat"
                  block
                  size="sm"
                />

                <upw-button
                  v-else-if="item.is_available"
                  :class="styles.domain.card.available.action"
                  :disabled="meta.isDisabled"
                  :label="
                    $tc(
                      'domain.card.available.action',
                      isSelected(item.domain) ? 0 : 1
                    )
                  "
                  :loading="meta.isProcessing && isSelected(item.domain)"
                  :prepend-icon="
                    isSelected(item.domain) ? 'check' : 'plus-circle'
                  "
                  :variant="isSelected(item.domain) ? 'flat' : 'outlined'"
                  @click.prevent="onUpdate(item.domain)"
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
                  :loading="meta.isProcessing && isSelected(item.domain)"
                  :prepend-icon="isSelected(item.domain) ? 'check' : 'transfer'"
                  :variant="isSelected(item.domain) ? 'flat' : 'outlined'"
                  @click.prevent="onUpdate(item.domain)"
                  block
                  size="sm"
                />
              </div>
            </div>
          </template>
        </upw-checkbox-list>
      </transition>
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
import { get, includes, isArray, isNil } from "lodash-es";

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
  },
  emits: ["update:modelValue", "toggle"],
  props: {
    i18nKey: { type: String, default: "domain.listings" },
    modelValue: { type: [String, Array], default: () => [] },
    items: { type: Array, required: true },
    dialog: { type: Boolean, default: false },
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
        "domain.card.owned",
        "domain.card.available",
        "domain.card.transfer",
        "domain.transitions.fade.enter",
        "domain.transitions.fade.leave",
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
      return isNil(this.modelValue)
        ? []
        : isArray(this.modelValue)
          ? this.modelValue
          : [this.modelValue];
    },
  },
  methods: {
    isSelected(value) {
      return includes(this.modelValue, value);
    },

    onUpdate(value) {
      if (this.meta.isDisabled || this.meta.isProcessing) return;
      this.$emit("toggle", value);
    },
  },
});
</script>

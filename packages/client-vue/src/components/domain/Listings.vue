<template>
  <section :class="styles.domain.listings.root">
    <header :class="styles.domain.listings.header">
      <slot name="header" v-bind="{ meta }"></slot>
    </header>

    <transition-group
      :enter-active-class="styles.domain.transitions.fade.enter.active"
      :enter-from-class="styles.domain.transitions.fade.enter.from"
      :enter-to-class="styles.domain.transitions.fade.enter.to"
      :leave-active-class="styles.domain.transitions.fade.leave.active"
      :leave-from-class="styles.domain.transitions.fade.leave.from"
      :leave-to-class="styles.domain.transitions.fade.leave.to"
    >
      <UpmEmpty
        :title="t('domain.empty.title')"
        :text="t('domain.empty.text')"
        v-if="!meta.isLoading && meta.isEmpty"
      />

      <UpwCheckboxList
        v-if="(!meta.isLoading && !meta.isEmpty) || meta.isLoadingMore"
        :class="styles.domain.listings.items"
        :items="items"
        :model-value="safeValue"
        no-input
        key="items"
        v-auto-animate
      >
        <!-- <template #prepend="{ item }"></template> -->

        <template #label="{ item }">
          <p :class="styles.domain.card.label">
            <span :class="styles.domain.card.badges">
              <span :class="styles.domain.card.text" v-if="item.is_owned">
                <span :class="styles.domain.card.owned.icon">
                  <Icon icon="lock" />
                </span>
                {{ t("domain.card.owned.label") }}
              </span>

              <span :class="styles.domain.card.text" v-else-if="item.in_basket">
                <span :class="styles.domain.card.basket.icon">
                  <Icon icon="basket" />
                </span>
                {{ t("domain.card.basket.label") }}
              </span>

              <span
                v-else-if="item.is_available"
                :class="styles.domain.card.text"
              >
                <span :class="styles.domain.card.available.icon">
                  <Icon icon="check" />
                </span>
                {{ t("domain.card.available.label") }}
              </span>

              <span :class="styles.domain.card.text" v-else>
                <span :class="styles.domain.card.transfer.icon">
                  <Icon icon="transfer" />
                </span>

                {{ t("domain.card.transfer.label") }}
              </span>

              <Badge
                v-if="item?.is_discounted"
                color="promotion"
                :label="t('domain.card.promotion')"
              />
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
                  t("domain.card.owned.ownership")
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
                  t("domain.card.basket.ownership")
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
                  t("domain.card.available.ownership")
                }}</strong>
              </template>

              <template #[`price`]>
                <span :class="styles.domain.card.available.prices">
                  <span
                    :class="styles.domain.card.available.discount"
                    v-if="item?.price_discounted"
                  >
                    {{ item.price_formatted }}
                  </span>
                  <em :class="styles.domain.card.available.price">
                    {{
                      item?.price_discounted
                        ? item.price_discounted_formatted
                        : item?.price
                          ? item.price_formatted
                          : t("product.free")
                    }}
                  </em>
                </span>
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
                <span :class="styles.domain.card.transfer.ownership">{{
                  t("domain.card.transfer.ownership")
                }}</span>
              </template>

              <template #[`action`]>
                <Button
                  :class="styles.domain.card.transfer.action"
                  :disabled="meta.isDisabled || isSelected(item.domain)"
                  :label="t('domain.card.transfer.action')"
                  variant="link"
                  @click.prevent="onUpdate(item.domain)"
                  size="sm"
                />
              </template>

              <template #[`price`]>
                <span :class="styles.domain.card.transfer.prices">
                  <span
                    :class="styles.domain.card.transfer.discount"
                    v-if="item?.price_discounted"
                  >
                    ({{ item.price_formatted }})
                  </span>

                  <span :class="styles.domain.card.transfer.price">
                    {{
                      item?.price_discounted
                        ? item.price_discounted_formatted
                        : item?.price
                          ? item.price_formatted
                          : t("product.free")
                    }}
                  </span>
                </span>
              </template>

              <template #[`tld`]>
                <em :class="styles.domain.card.transfer.tld">{{ item.tld }}</em>
              </template>
            </i18n-t>

            <div :class="styles.domain.card.actions">
              <template v-if="!item.is_owned && !item.in_basket">
                <Button
                  v-if="item.is_available"
                  :class="styles.domain.card.available.action"
                  :disabled="meta.isDisabled"
                  :label="
                    t(
                      'domain.card.available.action',
                      isSelected(item.domain) ? 0 : 1
                    )
                  "
                  :loading="meta.isProcessing && isSelected(item.domain)"
                  :prepend-icon="
                    isSelected(item.domain) ? 'check' : 'plus-circle'
                  "
                  :variant="isSelected(item.domain) ? 'flat' : 'outline'"
                  @click.prevent="onUpdate(item.domain)"
                  block
                  size="sm"
                />

                <Button
                  v-else-if="isSelected(item.domain)"
                  :class="styles.domain.card.transfer.action"
                  :disabled="meta.isDisabled"
                  :label="
                    t(
                      'domain.card.transfer.action',
                      isSelected(item.domain) ? 0 : 1
                    )
                  "
                  :loading="meta.isProcessing && isSelected(item.domain)"
                  :prepend-icon="isSelected(item.domain) ? 'check' : 'transfer'"
                  :variant="isSelected(item.domain) ? 'flat' : 'outline'"
                  @click.prevent="onUpdate(item.domain)"
                  block
                  size="sm"
                />
              </template>
            </div>
          </div>
        </template>
      </UpwCheckboxList>

      <UpwSkeletonList
        v-if="meta.isLoading"
        :class="styles.domain.listings.loading"
        :rows="6"
        key="more"
      />
    </transition-group>
  </section>
</template>

<script>
// --- external
import { computed, defineComponent } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles, cn } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import UpmEmpty from "./Empty.vue";
import {
  UpwSkeletonList,
  UpwCheckboxList,
  Icon,
  Badge,
  Button,
} from "@upmind/upwind";

// --- utils
import { get, includes, isArray, isNil } from "lodash-es";

// --- types
// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmDomainListings",
  directives: { autoAnimate: vAutoAnimate },
  components: {
    Icon,
    Badge,
    Button,
    UpwCheckboxList,
    UpwSkeletonList,
    // ---
    UpmEmpty,
  },
  emits: ["update:modelValue", "toggle"],
  props: {
    i18nKey: { type: String, default: "domain.listings" },
    modelValue: { type: [String, Array], default: () => [] },
    items: { type: Array, required: true },
    offset: { type: Number, default: 0 },
    // ---
    loading: { type: Boolean, default: false },
    processing: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  setup(props) {
    const { t } = useI18n();

    const meta = computed(() => ({
      isLoading: props.loading,
      isLoadingMore: props.loading && props.offset > 0,
      isEmpty: !props.items?.length,
      isDisabled: props.disabled,
      isProcessing: props.processing,
    }));
    const styles = useStyles(
      [
        "domain.listings",
        "domain.card",
        "domain.card.owned",
        "domain.card.basket",
        "domain.card.available",
        "domain.card.transfer",
        "domain.transitions.fade.enter",
        "domain.transitions.fade.leave",
      ],
      meta,
      config
    );

    return {
      t,
      styles,
      cn,
      meta,
      config,
    };
  },

  computed: {
    isOpen() {
      const value = this.meta.isEmpty;
      return value || this.modelValue;
    },
    translations() {
      return this.tm(this.i18nKey);
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

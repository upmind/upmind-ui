<template>
  <article :class="styles.domain.card.root">
    <header :class="styles.domain.card.header">
      <div :class="styles.domain.card.badges">
        <span :class="styles.domain.card.text" v-if="props.is_owned">
          <span :class="styles.domain.card.owned.icon">
            <Icon icon="lock" />
          </span>
          {{ t("domain.card.owned.label") }}
        </span>

        <span :class="styles.domain.card.text" v-else-if="props.in_basket">
          <span :class="styles.domain.card.basket.icon">
            <Icon icon="basket" />
          </span>
          {{ t("domain.card.basket.label") }}
        </span>

        <span v-else-if="props.is_available" :class="styles.domain.card.text">
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
          v-if="props.is_discounted"
          color="promotion"
          :label="t('domain.card.promotion')"
          variant="flat"
        />
      </div>

      <h5 :class="styles.domain.card.title">
        {{ props.sld }}
        <strong :class="styles.domain.card.underline">{{ props.tld }}</strong>
      </h5>
    </header>

    <footer :class="styles.domain.card.footer">
      <i18n-t
        v-if="props.is_owned"
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
            props.price_formatted
          }}</em>
        </template>

        <template #[`tld`]>
          <em :class="styles.domain.card.owned.tld">{{ props.tld }}</em>
        </template>
      </i18n-t>

      <i18n-t
        v-else-if="props.in_basket"
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
            props.price_formatted
          }}</em>
        </template>

        <template #[`tld`]>
          <em :class="styles.domain.card.basket.tld">{{ props.tld }}</em>
        </template>
      </i18n-t>

      <i18n-t
        v-else-if="props.is_available"
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
              v-if="!isNil(props.price_discounted)"
            >
              {{ props.price_formatted }}
            </span>
            <em :class="styles.domain.card.available.price">
              {{
                !isNil(props.price_discounted)
                  ? props.price_discounted_formatted
                  : props.price
                    ? props.price_formatted
                    : t("product.free")
              }}
            </em>
          </span>
        </template>

        <template #[`tld`]>
          <em :class="styles.domain.card.available.tld">{{ props.tld }}</em>
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
            :disabled="meta.isDisabled || props.selected"
            :label="t('domain.card.transfer.action')"
            variant="link"
            @click="onUpdate(props.domain)"
            size="sm"
          />
        </template>

        <template #[`price`]>
          <span :class="styles.domain.card.transfer.prices">
            <span
              :class="styles.domain.card.transfer.discount"
              v-if="!isNil(props.price_discounted)"
            >
              ({{ props.price_formatted }})
            </span>

            <span :class="styles.domain.card.transfer.price">
              {{
                !isNil(props.price_discounted)
                  ? props.price_discounted_formatted
                  : props.price
                    ? props.price_formatted
                    : t("product.free")
              }}
            </span>
          </span>
        </template>

        <template #[`tld`]>
          <em :class="styles.domain.card.transfer.tld">{{ props.tld }}</em>
        </template>
      </i18n-t>

      <div :class="styles.domain.card.actions">
        <template v-if="!props.is_owned && !props.in_basket">
          <Button
            v-if="props.is_available"
            :class="styles.domain.card.available.action"
            :disabled="meta.isDisabled"
            :label="t('domain.card.available.action', props.selected ? 0 : 1)"
            :loading="meta.isProcessing && props.selected"
            :prepend-icon="props.selected ? 'check' : 'plus-circle'"
            :variant="props.selected ? 'flat' : 'outline'"
            @click="onUpdate(props.domain)"
            block
            size="sm"
          />

          <Button
            v-else-if="props.selected"
            :class="styles.domain.card.transfer.action"
            :disabled="meta.isDisabled"
            :label="t('domain.card.transfer.action', props.selected ? 0 : 1)"
            :loading="meta.isProcessing && props.selected"
            :prepend-icon="props.selected ? 'check' : 'transfer'"
            :variant="props.selected ? 'flat' : 'outline'"
            @click="onUpdate(props.domain)"
            block
            size="sm"
          />
        </template>
      </div>
    </footer>
  </article>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { Icon, Badge, Button } from "@upmind/upwind";

// --- utils
import { isNil } from "lodash-es";

// --- types
import type { DomainCardProps } from "./types";
// -----------------------------------------------------------------------------
const emit = defineEmits(["update:selected"]);
const props = defineProps<DomainCardProps>();

// ---

const { t } = useI18n();

const meta = computed(() => ({
  isDisabled: props.disabled,
  isProcessing: props.processing,
}));

const styles = useStyles(
  [
    "domain.card",
    "domain.card.owned",
    "domain.card.basket",
    "domain.card.available",
    "domain.card.transfer",
  ],
  meta,
  config
);

function onUpdate(value: string): void {
  if (meta.value.isDisabled || meta.value.isProcessing) return;
  emit("update:selected", value);
}
</script>

<template>
  <Section
    id="basket-billing"
    :label="t('text.billing_details')"
    icon="building-07"
    :card="card"
    :border="false"
    :actions="[
      {
        label: t('action.change'),
        handler: onEdit
      }
    ]"
  >
    <!-- flat inside the Section card (no nested card) when the Section is the
         card; otherwise the details keep their own enclosing card -->
    <component
      :is="card ? 'div' : Card"
      size="sm"
      :class="styles.billing.card.root"
    >
      <Alert
        v-if="billingMeta.isAvailable && !billingMeta.isComplete"
        :title="t('billing.details_required_msg')"
        icon="alert-octagon"
        color="danger"
        variant="muted"
        size="sm"
      />
      <dl :class="styles.billing.summary.root">
        <div
          v-if="selectedCompany || billingMeta.needsCompany"
          :class="styles.billing.summary.row"
        >
          <dt
            :class="styles.billing.summary.label"
            :data-danger="!selectedCompany"
          >
            {{ t("text.company") }}:
          </dt>
          <dd v-if="selectedCompany" :class="styles.billing.summary.value">
            {{ selectedCompany.name }}
          </dd>
          <dd v-else>
            <Link
              :label="t('action.add_company')"
              size="sm"
              color="danger"
              @click="onEdit"
            />
          </dd>
        </div>

        <div
          v-if="selectedPhone?.phone || billingMeta.needsPhone"
          :class="styles.billing.summary.row"
        >
          <dt
            :class="styles.billing.summary.label"
            :data-danger="!selectedPhone?.phone"
          >
            {{ t("text.phone") }}:
          </dt>
          <dd v-if="selectedPhone?.phone" :class="styles.billing.summary.value">
            <Avatar
              :icon="lowerCase(selectedPhone.phone.country ?? '')"
              :class="styles.billing.summary.avatar"
            />
            <span> (+{{ selectedPhone.phone.countryCallingCode }}) </span>
            <span>{{ selectedPhone.phone.nationalNumber }}</span>
          </dd>
          <dd v-else>
            <Link
              :label="t('action.add_number')"
              size="sm"
              color="danger"
              @click="onEdit"
            />
          </dd>
        </div>

        <div :class="styles.billing.summary.row">
          <dt
            :class="styles.billing.summary.label"
            :data-danger="billingMeta.needsAddress && !selectedAddress"
          >
            {{ t("text.address") }}:
          </dt>
          <dd v-if="selectedAddress">
            <p>{{ selectedAddress.title }}</p>
            <p v-if="selectedAddress.address.address2">
              {{ selectedAddress.address.address2 }}
            </p>
            <p v-if="selectedAddress.address.city">
              {{ selectedAddress.address.city }}
            </p>
            <p v-if="selectedAddress.regionName">
              {{ selectedAddress.regionName }}
            </p>
            <p v-if="selectedAddress.address.postcode">
              {{ selectedAddress.address.postcode }}
            </p>
            <p v-if="selectedAddress.countryName">
              {{ selectedAddress.countryName }}
            </p>
          </dd>
          <dd v-else>
            <Link
              :label="t('action.add_address')"
              size="sm"
              :color="billingMeta.needsAddress ? 'danger' : 'primary'"
              @click="onEdit"
            />
          </dd>
        </div>
      </dl>
    </component>
  </Section>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useBasketBilling,
  useClientAddresses,
  useClientCompanies,
  useClientPhones
} from "@upmind-automation/headless";

import { useStyles } from "@upmind-automation/upmind-ui";

// --- components
import { Alert, Avatar, Card, Link } from "@upmind-automation/upmind-ui";
import Section from "../../../components/section/Section.vue";

// --- config
import config from "../billing.config";

// --- utils
import { lowerCase } from "lodash-es";

// -----------------------------------------------------------------------------

const props = defineProps<{
  card?: boolean;
}>();

const emit = defineEmits<{
  edit: [];
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();

const styles = useStyles(
  ["billing.card", "billing.summary"],
  computed(() => ({ card: props.card })),
  config
);

const { isReady, meta: billingMeta, model } = useBasketBilling();

// --- data loading

// The client-data isReady()s resolve once the auth check settles (checkout
// only mounts this summary for authenticated sessions), so a refresh
// mid-token-validation still loads saved billing.
await Promise.allSettled([
  isReady(),
  useClientAddresses().isReady(),
  useClientCompanies().isReady(),
  useClientPhones().isReady()
]);

// --- summary

const { getOne: getAddress } = useClientAddresses();
const { getOne: getCompany } = useClientCompanies();
const { getOne: getPhone } = useClientPhones();

const selectedCompany = computed(() =>
  getCompany(model.value?.companyId ?? undefined)
);
const selectedPhone = computed(() =>
  getPhone(model.value?.phoneId ?? undefined)
);
const selectedAddress = computed(() =>
  getAddress(model.value?.addressId ?? undefined)
);

const onEdit = () => emit("edit");
</script>

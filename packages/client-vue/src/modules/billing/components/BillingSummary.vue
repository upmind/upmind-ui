<template>
  <Section
    id="basket-billing"
    :label="t('text.billing_details')"
    icon="building-07"
    :card="false"
    :border="false"
    :actions="[
      {
        label: t('action.change'),
        handler: navigateToBilling
      }
    ]"
  >
    <Card :class="styles.billing.card.root" padding="md">
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
              @click="navigateToBilling"
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
              @click="navigateToBilling"
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
              @click="navigateToBilling"
            />
          </dd>
        </div>
      </dl>
    </Card>
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
  useClientPhones,
  useRoutingEngine
} from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- components
import { Alert, Avatar, Card, Link } from "@upmind-automation/upmind-ui";
import Section from "../../../components/section/Section.vue";

// --- config
import config from "../billing.config";

// --- utils
import { lowerCase } from "lodash-es";

// --- types
import type { RouteLocationAsRelativeGeneric } from "vue-router";

// -----------------------------------------------------------------------------

const props = defineProps<{
  billingRoute: RouteLocationAsRelativeGeneric;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { navigate } = useRoutingEngine();

const styles = useStyles(["billing.card", "billing.summary"], {}, config);

const { isReady, meta: billingMeta, model } = useBasketBilling();

// --- data loading

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

const navigateToBilling = () => {
  if (props.billingRoute) navigate(props.billingRoute);
};
</script>

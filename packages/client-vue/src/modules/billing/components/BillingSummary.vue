<template>
  <Section
    id="basket-billing"
    :label="t('text.billing_details')"
    value="billing-details"
    icon="building-07"
    :card="card"
    :border="false"
    :actions="[
      {
        label: t('action.change'),
        dataAttrs: { 'data-test-key': 'link-change' },
        handler: onEdit
      }
    ]"
  >
    <!-- Flat inside the Section card (no nested card) when the Section is the
         card; otherwise the details keep their own enclosing card. -->
    <component
      :is="card ? 'div' : CardRoot"
      :class="cardRootVariants({ card })"
    >
      <Alert
        v-if="billingMeta.isAvailable && !billingMeta.isComplete"
        :dataAttrs="{ 'data-test-key': 'billing-requirements-alert' }"
        :title="t('billing.details_required_msg')"
        variant="danger"
      >
        <template #icon><Icon icon="alert-octagon" /></template>
      </Alert>
      <dl
        data-test-key="billing-details-summary"
        :class="summaryRootVariants()"
      >
        <div
          v-if="selectedCompany || billingMeta.needsCompany"
          :class="summaryRowVariants()"
        >
          <dt :class="summaryLabelVariants()" :data-danger="!selectedCompany">
            {{ t("text.company") }}:
          </dt>
          <dd
            v-if="selectedCompany"
            :class="summaryValueVariants()"
            data-test-key="billing-summary-company"
            :data-test-value="selectedCompany.name"
          >
            {{ selectedCompany.name }}
          </dd>
          <dd v-else>
            <Link
              :data-attrs="{ 'data-test-key': 'link-add-company' }"
              size="sm"
              color="danger"
              @click="onEdit"
              >{{ t("action.add_company") }}</Link
            >
          </dd>
        </div>

        <div
          v-if="selectedPhone?.phone || billingMeta.needsPhone"
          :class="summaryRowVariants()"
        >
          <dt
            :class="summaryLabelVariants()"
            :data-danger="!selectedPhone?.phone"
          >
            {{ t("text.phone") }}:
          </dt>
          <dd v-if="selectedPhone?.phone" :class="summaryValueVariants()">
            <Avatar :class="summaryAvatarVariants()">
              <template #fallback>
                <Icon :icon="lowerCase(selectedPhone.phone.country ?? '')" />
              </template>
            </Avatar>
            <span> (+{{ selectedPhone.phone.countryCallingCode }}) </span>
            <span>{{ selectedPhone.phone.nationalNumber }}</span>
          </dd>
          <dd v-else>
            <Link
              :data-attrs="{ 'data-test-key': 'link-add-number' }"
              size="sm"
              color="danger"
              @click="onEdit"
              >{{ t("action.add_number") }}</Link
            >
          </dd>
        </div>

        <div :class="summaryRowVariants()">
          <dt
            :class="summaryLabelVariants()"
            :data-danger="billingMeta.needsAddress && !selectedAddress"
          >
            {{ t("text.address") }}:
          </dt>
          <dd
            v-if="selectedAddress"
            v-bind="addressTestAttrs(selectedAddress.title)"
          >
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
              :data-attrs="{ 'data-test-key': 'link-add-address' }"
              size="sm"
              :color="billingMeta.needsAddress ? 'danger' : 'default'"
              @click="onEdit"
              >{{ t("action.add_address") }}</Link
            >
          </dd>
        </div>
      </dl>
    </component>
  </Section>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  ScopeActorTypes,
  useBasketBilling,
  useClientAddresses,
  useClientCompanies,
  useClientPhones
} from "@upmind-automation/headless";
import { useTestAttrs } from "@upmind/ui";
import { Link } from "@upmind/ui";
import { CardRoot, Avatar } from "@upmind/ui";
import { Alert } from "@upmind/ui";
import { Icon } from "../../../components/icon";
import Section from "../../../components/section/Section.vue";
import {
  cardRootVariants,
  summaryRootVariants,
  summaryRowVariants,
  summaryLabelVariants,
  summaryValueVariants,
  summaryAvatarVariants
} from "../variants";
import { lowerCase } from "lodash-es";

// -----------------------------------------------------------------------------

defineProps<{
  card?: boolean;
}>();

const emit = defineEmits<{
  edit: [];
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();

const { isReady, meta: billingMeta, model } = useBasketBilling();

// --- data loading

// The client-data isReady()s resolve once the auth check settles (checkout
// only mounts this summary for authenticated sessions), so a refresh
// mid-token-validation still loads saved billing.
const addressesScope = useClientAddresses().as(ScopeActorTypes.CLIENT);
const companiesScope = useClientCompanies().as(ScopeActorTypes.CLIENT);

await Promise.allSettled([
  isReady(),
  addressesScope.useActions().isReady(),
  companiesScope.useActions().isReady(),
  useClientPhones().as(ScopeActorTypes.SELF).useActions().isReady()
]);

// --- summary

const { getOne: getAddress } = addressesScope.useContext();
const { getOne: getCompany } = companiesScope.useContext();
const { getOne: getPhone } = useClientPhones()
  .as(ScopeActorTypes.SELF)
  .useContext();

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

const addressTestAttrs = (value?: string) =>
  useTestAttrs({ key: "billing-summary-address", value });
</script>

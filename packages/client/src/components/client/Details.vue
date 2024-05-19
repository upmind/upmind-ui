<template>
  <section :class="styles.client.root">
    <header :class="styles.client.header">
      <slot name="header" v-bind="{ meta }"></slot>
    </header>

    <div v-if="!meta.isAvailable">
      <upm-auth no-tabs />
    </div>

    <upw-skeleton-list
      :class="styles.client.loading"
      v-else-if="meta.isLoading || (meta.isAdding && !meta.isEmpty)"
    />

    <!-- If we dont have any default or selected :- render a form for a new address -->
    <upm-item
      v-if="
        !meta.isLoading && (meta.isAdding || meta.isEditing) && !activeDialog
      "
      i18nKey="addresses"
      :model-value="selected"
      :dialog="!meta.isEmpty"
      :autosave="meta.isEmpty"
    />

    <!-- otherwise show the default address as a card -->
    <div :class="styles.client.content" v-else-if="selected">
      <h5 :class="styles.client.title">
        {{ $t("client.title") }}
        <upw-button
          variant="link"
          :label="$t('client.actions.change')"
          size="sm"
          @click="onChange"
        />
      </h5>

      <upm-card
        i18nKey="addresses"
        :model-value="selected"
        selected
        :selectable="false"
        no-actions
        :key="selected?.id"
      />

      <div :class="styles.client.actions">
        <upw-button
          :key="selected?.id"
          variant="link"
          :label="$t('client.actions.convert')"
          size="sm"
          @click="onEdit"
          v-if="!selected?.state?.value?.context?.model.company_details"
        />

        <!-- <pre>{{ selected?.state?.value?.context?.model }}</pre> -->
      </div>
    </div>

    <upm-listings
      v-if="activeDialog"
      v-model="activeDialog"
      type="addresses"
      i18nKey="addresses"
      dialog
      no-filter
    />

    <footer :class="styles.client.footer">
      <slot name="footer" v-bind="{ meta }"></slot>
    </footer>
  </section>
</template>

<script>
// --- external
import { defineComponent, provide, ref } from "vue";

// --- internal
import { useClientAddress, useClientAddresses } from "@upmind/flow-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import UpmAuth from "../session/Auth.vue";
import UpmItem from "./Item.vue";
import UpmCard from "./Card.vue";
import UpmListings from "./Listings.vue";
import { UpwSkeletonList, UpwButton } from "@upmind/upwind";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "Upmclient",
  components: {
    UpwSkeletonList,
    UpwButton,
    // ---
    UpmAuth,
    // ---
    UpmItem,
    UpmCard,
    UpmListings,
  },
  props: {
    i18nKey: { type: String },
  },
  setup() {
    const client = useClientAddresses();
    const styles = useStyles(["client"], client.meta, config);
    // ---

    const { selected, getSelected, addresses, add, meta } = client;

    // Provide the client to the form/card components
    provide("client", useClientAddress);

    // ---
    // check if we have a selected client, if we dont then we are creating a new one
    getSelected().then(selected => {
      if (!selected) add();
    });

    // ---

    return {
      add,
      selected,
      useClientAddress,
      meta,
      styles,
      addresses,
      // ---
      inlineForm: ref(true),
      activeTab: ref("addresses"),
      activeDialog: ref(false),
    };
  },

  methods: {
    onChange() {
      this.activeDialog = true;
    },
    onEdit() {
      const client = this.useClientAddress(this.selected);
      const model = client.model.value;
      client.edit();
      // force the company details to be shown
      client.input({ ...model, company_details: true });
    },
    onClose() {
      this.activeDialog = false;
    },
  },
});
</script>
.

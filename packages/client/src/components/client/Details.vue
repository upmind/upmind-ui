<template>
  <section :class="styles.clientDetails.root">
    <header :class="styles.clientDetails.header">
      <slot name="header" v-bind="{ meta }"></slot>
    </header>

    <div v-if="!meta.isAvailable">
      <upm-auth no-tabs />
    </div>

    <upw-skeleton-list
      :class="styles.clientDetails.loading"
      v-else-if="meta.isLoading"
    />

    <!-- otherwise render a form for a new address -->
    <upm-form
      v-else-if="meta.isAdding"
      i18nKey="addresses"
      :item="selected"
      :modal="false"
    />

    <!-- If we have a default address or company then render the card -->
    <div :class="styles.clientDetails.content" v-else-if="selected">
      <h5 :class="styles.clientDetails.title">
        {{ $t("client.details.title") }}
        <upw-button
          variant="link"
          :label="$t('client.details.actions.change')"
          size="sm"
          @click="onChange"
        />
      </h5>

      <upm-card
        i18nKey="addresses"
        :item="selected"
        selected
        :selectable="false"
        no-actions
      />

      <div :class="styles.clientDetails.actions">
        <!--
              <upw-button
              variant="link"
              :label="$t('client.details.actions.edit')"
              size="sm"
              @click="onEdit"
            /> -->
      </div>
    </div>

    <footer :class="styles.clientDetails.footer">
      <slot name="footer" v-bind="{ meta }"></slot>
    </footer>
  </section>
</template>

<script>
// --- external
import { defineComponent, provide } from "vue";

// --- internal
import { useClient } from "@upmind/flow-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import UpmAuth from "../session/Auth.vue";
import UpmForm from "./Form.vue";
import UpmCard from "./Card.vue";
import { UpwSkeletonList, UpwButton } from "@upmind/upwind";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmClientDetails",
  components: {
    UpwSkeletonList,
    UpmAuth,
    UpmForm,
    UpmCard,
    UpwButton,
  },
  props: {
    i18nKey: { type: String },
  },
  setup() {
    const client = useClient();
    const styles = useStyles(["clientDetails"], client.meta, config);
    // ---

    const {
      selected,
      getSelected,
      addresses,
      companies,
      add,
      address,
      company,
      meta,
    } = client;
    const selectedClient = address || company; // TODo provide the appropriat eone base don the type of default address or company
    // Provide the selected client to the form/card components
    provide("client", selectedClient);

    // ---
    // check if we have a selected client, if we dont then we are creating a new one
    getSelected().then(selected => {
      if (!selected) add();
    });

    // ---

    return {
      selected,
      selectedClient,
      meta,
      styles,
      addresses,
      companies,
    };
  },
  methods: {
    onChange() {},
    onEdit() {
      this.selectedClient(this.selected).edit();
    },
  },
});
</script>
.

<template>
  <section :class="styles.client.root" v-auto-animate>
    <header :class="styles.client.header">
      <slot name="header" v-bind="{ meta }"></slot>
    </header>

    <SkeletonList :class="styles.client.loading" v-if="meta.isLoading" />
    <!-- If we dont have any default or selected :- render a form for a new address -->
    <Item
      v-else-if="(meta.isAdding || meta.isEditing) && !open"
      :model-value="selected"
      :modal="meta.isEditing"
      :key="selected?.id"
      :color="color"
      i18nKey="unified"
      open
    />

    <!-- otherwise show the default address as a card -->
    <div :class="styles.client.content" v-else-if="selected">
      <h5 :class="styles.client.title">
        {{ t("client.title") }}

        <DropdownMenu v-if="!noActions" :items="actions" size="sm" />

        <!-- <span :class="styles.client.actions">
          <Button
            :key="selected?.id"
            variant="tonal"
            :label="t('client.actions.convert')"
            size="xs"
            @click="onEdit"
            v-if="!selected?.state?.value?.context?.model?.companyDetails"
          />
          <Button
            variant="tonal"
            :label="t('client.actions.change')"
            size="xs"
            @click="onChange"
          />
        </span> -->
      </h5>

      <Card
        i18nKey="unified"
        :model-value="selected"
        selected
        :selectable="false"
        no-actions
        :key="selected?.id"
      />

      <div :class="styles.client.actions">
        <!-- <Button
          :key="selected?.id"
          variant="tonal"
          :label="t('client.actions.convert')"
          size="xs"
          @click="onEdit"
          v-if="!selected?.state?.value?.context?.model?.companyDetails"
        /> -->
      </div>
    </div>

    <Listings
      :open="open"
      type="unified"
      i18nKey="unified"
      modal
      no-filter
      @update:open="onClose"
      :color="color"
    />

    <footer :class="styles.client.footer">
      <slot name="footer" v-bind="{ meta }"></slot>
    </footer>
  </section>
</template>

<script>
// --- external
import { defineComponent, provide, ref } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useClientUnifiedAddress,
  useClientUnifiedAddresses,
} from "@upmind-automation/headless-vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../client/config.cva";

// --- components
import Item from "../Client/Item.vue";
import Card from "../Client/Card.vue";
import Listings from "../Client/Listings.vue";
import {
  SkeletonList,
  Button,
  DropdownMenu,
} from "@upmind-automation/upmind-ui";

// --- utils
import { get, isEmpty } from "lodash-es";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "Client",
  directives: { autoAnimate: vAutoAnimate },
  components: {
    SkeletonList,
    Button,
    DropdownMenu,
    // ---
    Item,
    Card,
    Listings,
  },
  emits: ["update:modelValue"],
  props: {
    i18nKey: { type: String },
    modelValue: { type: Object },
    color: { type: String, default: "base" },
  },
  setup() {
    const { t } = useI18n();
    const client = useClientUnifiedAddresses();
    const styles = useStyles(["client"], client.meta, config);
    // ---

    const { select, selected, getSelected, addresses, add, meta, state } =
      client;

    // Provide the client to the form/card components
    provide("client", useClientUnifiedAddress);

    // ---
    // check if we have a selected client, if we dont then we are creating a new one
    getSelected().then(selected => {
      if (!selected) add();
    });

    // ---

    return {
      t,
      add,
      selected,
      select,
      useClientUnifiedAddress,
      meta,
      state,
      styles,
      addresses,
      // ---
      open: ref(false),
    };
  },

  computed: {
    actions() {
      return [
        // {
        //   label: this.t(
        //     "client.actions.edit",
        //     this.selected?.state?.value?.context?.model?.companyDetails ? 0 : 1
        //   ),
        //   handler: () => this.onEdit(),
        // },
        {
          label: this.t("client.actions.convert"),
          handler: () => this.onEdit(true),
          hidden: this.selected?.state?.value?.context?.model?.companyDetails,
        },
        {
          label: this.t("client.actions.change"),
          handler: () => this.onChange(),
        },
      ];
    },
  },
  methods: {
    onChange() {
      this.open = true;
    },
    onEdit(companyDetails = false) {
      const client = this.useClientUnifiedAddress(this.selected);
      const model = client.model.value;
      client.edit();
      // force the company details to be shown
      client.input({ ...model, companyDetails });
    },
    onClose(value) {
      this.open = value;
    },
  },

  watch: {
    modelValue(model, oldModel) {
      const id = model?.companyId || model?.addressId;
      const oldId = oldModel?.companyId || oldModel?.addressId;

      if (id && id != oldId) this.select(id);
    },
    selected(value, oldValue) {
      if (value?.id === oldValue?.id) return;

      const model = get(value?.state?.value, "context.model", {});
      if (isEmpty(model)) return;

      this.$emit("update:modelValue", model);
    },
  },
});
</script>
.

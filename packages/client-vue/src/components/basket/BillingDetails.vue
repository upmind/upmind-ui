<template>
  <section :class="styles.client.root" v-auto-animate>
    <header :class="styles.client.header">
      <slot name="header" v-bind="{ meta }"></slot>
    </header>

    <UpwSkeletonList
      :class="styles.client.loading"
      v-if="
        meta.isLoading || (meta.isAdding && !meta.isEmpty) || meta.isEditing
      "
    />

    <!-- If we dont have any default or selected :- render a form for a new address -->
    <UpmItem
      v-if="!meta.isLoading && (meta.isAdding || meta.isEditing) && !open"
      i18nKey="unified"
      :model-value="selected"
      :key="selected?.id"
      :color="color"
    />

    <!-- otherwise show the default address as a card -->
    <div :class="styles.client.content" v-else-if="selected">
      <h5 :class="styles.client.title">
        {{ $t("client.title") }}

        <DropdownMenu v-if="!noActions" :items="actions" size="sm" />

        <!-- <span :class="styles.client.actions">
          <Button
            :key="selected?.id"
            variant="tonal"
            :label="$t('client.actions.convert')"
            size="xs"
            @click="onEdit"
            v-if="!selected?.state?.value?.context?.model?.company_details"
          />
          <Button
            variant="tonal"
            :label="$t('client.actions.change')"
            size="xs"
            @click="onChange"
          />
        </span> -->
      </h5>

      <UpmCard
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
          :label="$t('client.actions.convert')"
          size="xs"
          @click="onEdit"
          v-if="!selected?.state?.value?.context?.model?.company_details"
        /> -->
      </div>
    </div>

    <UpmListings
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
// --- internal
import {
  useClientUnifiedAddress,
  useClientUnifiedAddresses,
} from "@upmind/headless-vue";
import { useStyles } from "@upmind/upwind";
import config from "../client/config.cva";

// --- components
import UpmItem from "../Client/Item.vue";
import UpmCard from "../Client/Card.vue";
import UpmListings from "../Client/Listings.vue";
import { UpwSkeletonList, Button, DropdownMenu } from "@upmind/upwind";

// --- utils
import { get, isEmpty } from "lodash-es";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmClient",
  directives: { autoAnimate: vAutoAnimate },
  components: {
    UpwSkeletonList,
    Button,
    DropdownMenu,
    // ---
    UpmItem,
    UpmCard,
    UpmListings,
  },
  emits: ["update:modelValue"],
  props: {
    i18nKey: { type: String },
    modelValue: { type: Object },
    color: { type: String, default: "base" },
  },
  setup() {
    const client = useClientUnifiedAddresses();
    const styles = useStyles(["client"], client.meta, config);
    // ---

    const { select, selected, getSelected, addresses, add, meta } = client;

    // Provide the client to the form/card components
    provide("client", useClientUnifiedAddress);

    // ---
    // check if we have a selected client, if we dont then we are creating a new one
    getSelected().then(selected => {
      if (!selected) add();
    });

    // ---

    return {
      add,
      selected,
      select,
      useClientUnifiedAddress,
      meta,
      styles,
      addresses,
      // ---
      open: ref(false),
    };
  },

  computed: {
    actions() {
      return {
        convert: {
          // variant: "tonal",
          // size: "xs",
          label: this.$t("client.actions.convert"),
          handler: () => this.onEdit(),
        },
        change: {
          // variant: "tonal",
          // size: "xs",
          label: this.$t("client.actions.change"),
          handler: () => this.onChange(),
        },
      };
    },
  },
  methods: {
    onChange() {
      this.open = true;
    },
    onEdit() {
      const client = this.useClientUnifiedAddress(this.selected);
      const model = client.model.value;
      client.edit();
      // force the company details to be shown
      client.input({ ...model, company_details: true });
    },
    onClose(value) {
      this.open = value;
    },
  },

  watch: {
    modelValue: {
      immediate: true,
      handler(model) {
        if (isEmpty(model)) return;
        const id = model?.company_id || model?.address_id;
        this.select(id);
      },
    },
    selected: {
      immediate: true,
      handler(value, oldValue) {
        if (value?.id === oldValue?.id) return;

        const model = get(value?.state?.value, "context.model", {});
        if (isEmpty(model)) return;

        this.$emit("update:modelValue", model);
      },
    },
  },
});
</script>
.

<template>
  <component
    v-if="modal || (!modal && isOpen)"
    :is="modal ? 'Drawer' : 'Section'"
    title="Change address"
    :open="isOpen"
    @reject="onClose"
    @update:open="onClose"
    :skrim="skrim"
    :class="styles.clientListings.root"
    :class-footer="styles.clientListings.footer"
    v-auto-animate
    size="2xl"
  >
    <template #header>
      <slot name="header" v-bind="{ meta }"></slot>
    </template>

    <div v-if="!meta.isAvailable">
      <Auth no-tabs />
    </div>

    <SkeletonList
      :class="styles.clientListings.loading"
      v-else-if="meta.isLoading"
    />

    <template v-else>
      <Input
        v-if="!noFilter && meta.canFilter"
        @input="filter($event?.currentTarget?.value)"
        :placeholder="t(`client.${type}.actions.filter`)"
        size="sm"
      />

      <div :class="styles.clientListings.items">
        <Card
          v-for="item in sortedItems"
          :key="item.id"
          :model-value="item"
          :selected="item.id === selected?.id"
          :hidden="meta.isAdding && item.id === selected?.id"
          :disabled="meta.isEditing && item.id === selected?.id"
          :i18nKey="i18nKey"
          :no-actions="noActions"
          @update:modelValue="onSelect"
          @click:action="onClose"
        />
      </div>

      <slot name="empty" v-bind="{ meta }" v-if="meta.isEmpty">
        <Empty :i18nKey="type" />
      </slot>

      <Item
        v-if="meta.isEditing || meta.isAdding"
        :model-value="selected"
        :key="selected?.id"
        :i18nKey="i18nKey"
        @reject="onClose"
        :color="color"
        open
        nested
      />

      <div
        :class="styles.clientListings.actions"
        v-if="!meta.isAdding && !meta.isEditing && !meta.isLoading && !modal"
      >
        <Button
          :label="t(`client.${type}.actions.add`)"
          variant="link"
          @click="add"
          block
        />
      </div>
    </template>

    <template #footer>
      <slot name="footer" v-bind="{ meta }"></slot>
    </template>

    <template #actions>
      <Button
        v-for="(action, key) in actions"
        :key="key"
        v-bind="action"
        :loading="action.loading"
        :disabled="action?.disabled"
        @click="doAction(action)"
        :color="action.color"
      />
    </template>
  </component>
</template>

<script>
// --- external
import { defineComponent, provide, ref } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useClientEmails,
  useClientEmail,
  useClientPhones,
  useClientPhone,
  useClientAddresses,
  useClientAddress,
  useClientCompanies,
  useClientCompany,
  useClientUnifiedAddresses,
  useClientUnifiedAddress,
} from "@upmind-automation/headless-vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./config.cva";

// --- components
import Section from "../../../components/content/ContentSection.vue";
import Auth from "../../../components/session/AuthTabs.vue";
import Empty from "./Empty.vue";
import Card from "./Card.vue";
import Item from "./Item.vue";
import { Input, SkeletonList } from "@upmind-automation/upmind-ui";

// --- custom elements
import { Button, Drawer } from "@upmind-automation/upmind-ui";

// --- utils
import { isFunction } from "lodash-es";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "ClientListings",
  directives: { autoAnimate: vAutoAnimate },
  components: {
    Button,
    Drawer,
    Input,
    SkeletonList,
    Section,
    // ---
    Auth,
    // ---
    Empty,
    Card,
    Item,
  },
  emits: ["update:open", "add", "select"],
  props: {
    type: {
      type: String, //as PropType<"addresses" | "emails" | "phones" | "companies">,
      required: true,
    },
    i18nKey: { type: String, required: true },
    open: { type: Boolean },
    modal: { type: Boolean, default: false },
    color: { type: String, default: "base" },
    skrim: { type: String, default: "dark" },
    // ---
    noActions: { type: Boolean },
    noFilter: { type: Boolean },
    cols: { type: [String, Number], default: 1 },
  },
  setup(props) {
    const { t } = useI18n();

    let clientListings, client;

    switch (props.type) {
      case "addresses":
        clientListings = useClientAddresses();
        client = useClientAddress;
        break;
      case "emails":
        clientListings = useClientEmails();
        client = useClientEmail;
        break;
      case "phones":
        clientListings = useClientPhones();
        client = useClientPhone;
        break;
      case "companies":
        clientListings = useClientCompanies();
        client = useClientCompany;
        break;
      case "unified":
        clientListings = useClientUnifiedAddresses();
        client = useClientUnifiedAddress;
        break;
    }

    const styles = useStyles(["clientListings"], clientListings.meta, config);

    // provide the correct composable to our child components
    provide("client", client);

    const active = ref(clientListings.selected.value);

    // safetycheck to ensure we have a selected item
    clientListings
      .isReady()
      .then(() => (active.value = clientListings.selected.value));

    return {
      t,
      ...clientListings,
      active,
      styles,
    };
  },

  computed: {
    actions() {
      return {
        add: {
          label: this?.t(`client.${this.type}.actions.add`),
          variant: "link",
          color: this.color,
          block: true,
          handler: () => {
            this.add();
          },
        },
        confirm: {
          label: this?.t(`client.${this.type}.actions.confirm`),
          variant: "flat",
          color: this.color,
          block: true,
          handler: () => {
            this.onClose();
          },
        },
      };
    },
    sortedItems() {
      // if we may have an active 'selected', and we want to sort the items so that the selected item is always on top
      // we dont do this to the  reactive 'selected' to prevent jank re-ordering
      // we use the inital value as opposed to the reactive value
      return this.items.sort((x, y) =>
        x.id == this.active?.id ? -1 : y.id == this.active?.id ? 1 : 0
      );
    },
    isOpen() {
      return this.open;
    },
  },
  methods: {
    onClose(value) {
      this.$emit("update:open", value);
    },

    onSelect(item) {
      this.select(item.id);
      this.$emit("update:open", false);
    },
    doAction(item) {
      if (isFunction(item?.handler)) {
        item.handler();
      }
    },
  },
});
</script>

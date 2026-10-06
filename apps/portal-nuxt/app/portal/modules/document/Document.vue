<template>
  <EmptyState
    v-if="meta.isEmpty"
    :title="props.emptyTitle"
    :description="props.emptyDescription"
  />

  <article
    v-else
    :class="meta.rootClass"
    v-bind="useTestAttrs({ key: 'portal-document' })"
  >
    <div v-if="meta.hasMessages" :class="DOCUMENT_MESSAGES_CLASS">
      <Alert
        v-for="message in props.messages"
        :key="message.id"
        :variant="message.tone"
        :title="message.title"
        :description="message.message"
        v-bind="
          useTestAttrs({ key: 'portal-document-message', value: message.id })
        "
      >
        <template v-if="message.action" #action>
          <Button
            size="xs"
            variant="outline"
            @click="emits('select', message.action.value)"
            >{{ message.action.label }}</Button
          >
        </template>
      </Alert>
    </div>

    <header :class="DOCUMENT_HEADER_CLASS">
      <div>
        <p :class="DOCUMENT_PARTY_LABEL_CLASS">{{ props.header?.title }}</p>
        <div :class="DOCUMENT_TITLE_ROW_CLASS">
          <Heading :level="2" size="lg">{{ props.header?.number }}</Heading>
          <StatusBadge
            v-if="props.header?.status"
            :tone="props.header.status.tone"
            :dot="false"
            >{{ props.header.status.label }}</StatusBadge
          >
        </div>
        <div :class="DOCUMENT_DATES_CLASS">
          <span v-for="date in props.header?.dates" :key="date.id">
            <span :class="DOCUMENT_DATE_LABEL_CLASS">{{ date.label }}</span>
            <span class="type-data ms-1 text-sm">{{ date.value }}</span>
          </span>
        </div>
      </div>

      <div v-if="meta.hasActions" :class="DOCUMENT_ACTIONS_CLASS">
        <template v-for="action in props.actions" :key="action.value">
          <DropdownMenu
            v-if="action.options?.length"
            :items="optionItems(action.options)"
          >
            <template #trigger>
              <Button size="sm" :variant="documentActionTone(action.variant)">
                {{ action.label }}
                <ChevronDown />
              </Button>
            </template>
          </DropdownMenu>
          <Button
            v-else
            size="sm"
            :variant="documentActionTone(action.variant)"
            @click="emits('select', action.value)"
            >{{ action.label }}</Button
          >
        </template>
      </div>
    </header>

    <Separator />

    <section v-if="props.party" :class="DOCUMENT_PARTY_CLASS">
      <div
        v-for="block in meta.partyBlocks"
        :key="block.label"
        :class="DOCUMENT_PARTY_BLOCK_CLASS"
      >
        <p :class="DOCUMENT_PARTY_LABEL_CLASS">{{ block.label }}</p>
        <p class="text-display font-medium">{{ block.name }}</p>
        <p v-if="block.company" :class="DOCUMENT_PARTY_LINE_CLASS">
          {{ block.company }}
        </p>
        <p
          v-for="(line, index) in block.lines"
          :key="index"
          :class="DOCUMENT_PARTY_LINE_CLASS"
        >
          {{ line }}
        </p>
        <p v-if="block.taxNumber" :class="DOCUMENT_PARTY_LINE_CLASS">
          {{ block.taxNumber }}
        </p>
        <p v-if="block.registrationNumber" :class="DOCUMENT_PARTY_LINE_CLASS">
          {{ block.registrationNumber }}
        </p>
      </div>
    </section>

    <Table v-if="meta.hasLines">
      <TableHeader>
        <TableRow>
          <TableHead
            v-for="heading in props.lineHeadings"
            :key="heading.label"
            :numeric="heading.numeric"
            >{{ heading.label }}</TableHead
          >
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="line in meta.visibleLines"
          :key="line.id"
          v-bind="useTestAttrs({ key: 'portal-document-line', value: line.id })"
        >
          <TableCell>{{ line.description }}</TableCell>
          <TableCell numeric class="text-muted">{{ line.quantity }}</TableCell>
          <TableCell numeric class="text-muted">{{ line.unit }}</TableCell>
          <TableCell numeric>{{ line.amount }}</TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <Button
      v-if="meta.linesToggleLabel"
      size="sm"
      variant="outline"
      block
      :aria-expanded="areLinesExpanded"
      @click="areLinesExpanded = !areLinesExpanded"
      >{{ meta.linesToggleLabel }}</Button
    >

    <div
      v-if="props.totals"
      :class="[DOCUMENT_TOTALS_CLASS, DOCUMENT_TOTALS_STAMP_WRAP_CLASS]"
    >
      <DescriptionList
        :items="meta.totalRows"
        align="between"
        size="sm"
        dividers
        :data-attrs="{ 'data-test-key': 'portal-document-totals' }"
      />
      <span
        v-if="props.paidStamp"
        :class="DOCUMENT_PAID_STAMP_CLASS"
        v-bind="useTestAttrs({ key: 'portal-document-paid-stamp' })"
        >{{ props.paidStamp }}</span
      >
    </div>

    <DescriptionList
      v-if="meta.hasDetails"
      :items="meta.detailRows"
      align="between"
      size="sm"
      :class="DOCUMENT_DETAILS_CLASS"
      :data-attrs="{ 'data-test-key': 'portal-document-details' }"
    />

    <template v-if="meta.hasPayments">
      <Separator />
      <section class="flex flex-col gap-3">
        <Heading :level="3" size="sm">{{ props.paymentsTitle }}</Heading>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                v-for="heading in props.paymentHeadings"
                :key="heading.label"
                :numeric="heading.numeric"
                >{{ heading.label }}</TableHead
              >
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="payment in props.payments"
              :key="payment.id"
              v-bind="
                useTestAttrs({
                  key: 'portal-document-payment',
                  value: payment.id
                })
              "
            >
              <TableCell class="text-muted">{{ payment.date }}</TableCell>
              <TableCell>{{ payment.method }}</TableCell>
              <TableCell numeric>{{ payment.amount }}</TableCell>
              <TableCell class="text-right">
                <StatusBadge :tone="payment.status.tone" :dot="false">{{
                  payment.status.label
                }}</StatusBadge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
    </template>
  </article>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/document/Document
 * @description The `document` module (`content`-tagged) — one whole billing
 * document: header, parties, lines, totals, payments and its own notices,
 * over `@upmind/ui`'s `Heading`, `Table`, `DescriptionList` and `Separator`.
 * Legacy's invoice and credit-note views are the same composition with
 * different words, so they are the same module with different data.
 *
 * Every figure arrives worded (plan R6) and every control emits its own value
 * — the module renders, it does not decide.
 */
import {
  Alert,
  Button,
  DescriptionList,
  DropdownMenu,
  EmptyState,
  Heading,
  Separator,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useTestAttrs
} from "@upmind/ui";
import { ChevronDown } from "lucide-vue-next";
import { computed, ref } from "vue";
import {
  DOCUMENT_ACTIONS_CLASS,
  DOCUMENT_DATES_CLASS,
  DOCUMENT_DATE_LABEL_CLASS,
  DOCUMENT_HEADER_CLASS,
  DOCUMENT_MESSAGES_CLASS,
  DOCUMENT_PARTY_BLOCK_CLASS,
  DOCUMENT_PARTY_CLASS,
  DOCUMENT_PARTY_LABEL_CLASS,
  DOCUMENT_PARTY_LINE_CLASS,
  DOCUMENT_TITLE_ROW_CLASS,
  DOCUMENT_DETAILS_CLASS,
  DOCUMENT_PAID_STAMP_CLASS,
  DOCUMENT_TOTALS_CLASS,
  DOCUMENT_TOTALS_STAMP_WRAP_CLASS,
  documentActionTone,
  documentRootClass
} from "./variants";
import { compact, map, replace, size, take } from "lodash-es";
import type {
  DocumentModuleAction,
  DocumentModuleEmits,
  DocumentModuleLine,
  DocumentModuleProps,
  DocumentModuleTotal
} from "./types";
import type { DescriptionListOption, MenuItem } from "@upmind/ui";

defineOptions({ name: "PortalDocument" });

const props = defineProps<DocumentModuleProps>();

const emits = defineEmits<DocumentModuleEmits>();
const areLinesExpanded = ref(false);
function optionItems(
  options: NonNullable<DocumentModuleAction["options"]>
): MenuItem[] {
  return map(options, option => ({
    label: option.label,
    value: option.value,
    onSelect: () => emits("select", option.value)
  }));
}

/** One labelled fact in the footer well — prose, not a figure, so it is not numeric. */
function detailRow(row: DocumentModuleTotal): DescriptionListOption {
  return {
    term: row.label,
    description: row.value,
    dataAttrs: {
      "data-test-key": "portal-document-detail",
      "data-test-value": row.label
    }
  };
}

function totalRow(row: DocumentModuleTotal): DescriptionListOption {
  return {
    term: row.label,
    description: row.value,
    numeric: true,
    dataAttrs: {
      "data-test-key": "portal-document-total",
      "data-test-value": row.label
    }
  };
}

/** Legacy kept the whole table open while only ONE row would hide (`hasHiddenItems`). */
function hiddenLineCount(): number {
  const cap = props.lineCap;
  if (cap === undefined) return 0;
  const held = size(props.lines);
  if (held <= cap + 1) return 0;
  return held - cap;
}

/** The rows that render — every line while there is nothing worth hiding. */
function visibleLines(): DocumentModuleLine[] {
  const lines = [...(props.lines ?? [])];
  if (areLinesExpanded.value || hiddenLineCount() === 0) return lines;
  return take(lines, props.lineCap);
}

/** What the collapse control says, or nothing where there is nothing to collapse. */
function linesToggleLabel(): string | undefined {
  const hidden = hiddenLineCount();
  if (hidden === 0) return undefined;
  if (areLinesExpanded.value) return props.showLessLinesLabel;
  return replace(props.showMoreLinesLabel ?? "", "{n}", String(hidden));
}

const meta = computed(() => {
  const totals = props.totals;
  const rows: DescriptionListOption[] = [];
  if (totals !== undefined) {
    rows.push(totalRow(totals.subtotal));
    for (const tax of totals.taxes) rows.push(totalRow(tax));
    if (totals.discount !== undefined) rows.push(totalRow(totals.discount));
    rows.push(totalRow(totals.total));
    rows.push(totalRow(totals.paid));
    rows.push(totalRow(totals.balance));
  }
  return {
    // No header at all means the route named a document the dataset does not
    // hold — one empty state, never a frame around nothing.
    isEmpty: props.header === undefined,
    hasDetails: size(props.details) > 0,
    detailRows: map(props.details ?? [], detailRow),
    rootClass: documentRootClass(props.variant),
    hasMessages: size(props.messages) > 0,
    hasActions: size(props.actions) > 0,
    hasLines: size(props.lines) > 0,
    visibleLines: visibleLines(),
    linesToggleLabel: linesToggleLabel(),
    hasPayments: size(props.payments) > 0,
    partyBlocks: compact([props.party?.brand, props.party?.client]),
    totalRows: rows
  };
});
</script>

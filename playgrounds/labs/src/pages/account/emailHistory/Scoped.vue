<template>
  <UpmLayout>
    <div class="mx-auto flex max-w-5xl flex-col gap-y-6">
      <Card class="p-4 text-xs">
        <p class="mb-2 font-semibold">
          Four-layer access (ADR-001) — useClientReceivedEmails().as(client)
        </p>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <p class="font-medium">useActions()</p>
            <p class="text-gray-500">{{ actionKeys.join(", ") }}</p>
          </div>
          <div>
            <p class="font-medium">useContext()</p>
            <p class="text-gray-500">{{ contextKeys.join(", ") }}</p>
          </div>
          <div>
            <p class="font-medium">useMeta()</p>
            <p class="text-gray-500">{{ metaKeys.join(", ") }}</p>
          </div>
        </div>
      </Card>

      <div class="flex flex-wrap gap-2">
        <Button
          v-for="tab in statusTabs"
          :key="tab.label"
          :class="activeStatus === tab.value ? 'is-primary' : 'is-secondary'"
          class="px-4 py-2"
          @click="setStatus(tab.value)"
          >{{ tab.label }}</Button
        >
      </div>

      <div class="flex gap-4">
        <input
          type="search"
          v-model="queryInput"
          @input="debouncedFilterQuery"
          placeholder="Filter by free text (actions.filters.query)..."
          class="w-full rounded-md border border-gray-300 p-2"
        />
        <input
          type="search"
          v-model="subjectInput"
          @input="debouncedFilterSubject"
          placeholder="Filter by subject (actions.filters.subject)..."
          class="w-full rounded-md border border-gray-300 p-2"
        />
      </div>

      <div class="flex flex-wrap items-center gap-4">
        <select
          v-model="sortProperty"
          @change="applySort"
          class="rounded-md border border-gray-300 p-2"
        >
          <option :value="ReceivedEmailsSortableProperties.DEFAULT">
            Sort: Date
          </option>
          <option :value="ReceivedEmailsSortableProperties.SUBJECT">
            Sort: Subject
          </option>
        </select>
        <select
          v-model="sortDirection"
          @change="applySort"
          class="rounded-md border border-gray-300 p-2"
        >
          <option :value="RequestSortDirection.ASC">Ascending</option>
          <option :value="RequestSortDirection.DESC">Descending</option>
        </select>
        <Button class="is-secondary px-4 py-2" @click="resetSort"
          >Reset sort (module default — sort())</Button
        >
      </div>

      <Loading label="Loading" :active="isLoading" class-active="w-full">
        <p v-if="hasError" class="text-red-600">
          meta.hasError — the list query failed.
        </p>
        <p v-else-if="isEmpty" class="text-gray-500">
          meta.isEmpty — no emails match the current filters.
        </p>
        <table v-else class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="py-2">Subject</th>
              <th class="py-2">To</th>
              <th class="py-2">Status</th>
              <th class="py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="email in data"
              :key="email.id"
              class="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
              @click="openEmail(email.id)"
            >
              <td class="py-2">{{ email.subject }}</td>
              <td class="py-2">{{ email.to }}</td>
              <td class="py-2">{{ email.status }}</td>
              <td class="py-2">{{ emailDate(email) }}</td>
            </tr>
          </tbody>
        </table>
      </Loading>

      <div class="flex w-full items-center justify-between">
        <Button
          class="is-primary px-6 py-3"
          @click="() => prevPage()"
          :disabled="!hasPrevPage || hasError"
          >Previous</Button
        >

        <div class="text-center">
          <p class="text-sm">
            Showing
            {{
              pagination.from === pagination.to
                ? `${pagination.from}`
                : `${pagination.from}-${pagination.to}`
            }}
            of {{ pagination.total.toString() }} items
          </p>
          <p class="text-xs text-gray-400">
            Page {{ pagination.page.toString() }} of
            {{ pagination.pages.toString() }}
          </p>
        </div>

        <Button
          class="is-primary px-6 py-3"
          @click="() => nextPage()"
          :disabled="!hasNextPage || hasError"
          >Next</Button
        >
      </div>
    </div>
  </UpmLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { UpmLayout } from "@upmind-automation/client-vue";
import {
  useClientReceivedEmails,
  ReceivedEmailsSortableProperties,
  RequestSortDirection,
  ScopeActorTypes,
  SentEmailStatus
} from "@upmind-automation/headless";
import { Button, Loading, Card } from "@upmind/ui";
import { debounce, keys } from "lodash-es";
import type { SentEmail } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const router = useRouter();

const history = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
const actions = history.useActions();
const context = history.useContext();
const meta = history.useMeta();

const actionKeys = keys(actions);
const contextKeys = keys(context);
const metaKeys = keys(meta);

await actions.isReady();

const { data, pagination } = context;
const { nextPage, prevPage, filters, sort } = actions;
// `meta` is a plain object of individual `ComputedRef`s (the new per-flag
// shape, not the legacy single-`meta`-computed form) — destructured here so
// each flag auto-unwraps as its own top-level template binding.
const { hasError, isEmpty, isLoading, hasNextPage, hasPrevPage } = meta;

// --- status tabs

const statusTabs: { label: string; value: SentEmailStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Sent", value: SentEmailStatus.SENT },
  { label: "Bounced", value: SentEmailStatus.BOUNCED },
  { label: "Failed", value: SentEmailStatus.ERROR }
];

const activeStatus = ref<SentEmailStatus | undefined>(undefined);

function setStatus(status: SentEmailStatus | undefined) {
  activeStatus.value = status;
  filters.status(status);
}

// --- free-text + subject filters

const queryInput = ref("");
const subjectInput = ref("");

const debouncedFilterQuery = debounce(() => {
  filters.query(queryInput.value || undefined);
}, 500);

const debouncedFilterSubject = debounce(() => {
  filters.subject(subjectInput.value || undefined);
}, 500);

// --- sort

// Reflects the module default the collection already loaded with — chosen to
// match `sort()`'s own no-argument fallback, not a UI-invented default.
const sortProperty = ref<ReceivedEmailsSortableProperties>(
  ReceivedEmailsSortableProperties.DEFAULT
);
const sortDirection = ref<RequestSortDirection>(RequestSortDirection.DESC);

function applySort() {
  sort(sortProperty.value, sortDirection.value);
}

function resetSort() {
  sortProperty.value = ReceivedEmailsSortableProperties.DEFAULT;
  sortDirection.value = RequestSortDirection.DESC;
  sort();
}

// --- rows

function emailDate(email: SentEmail): string {
  if (email.meta.isBounced) return email.dateBounced.relative ?? "";
  if (email.meta.isError) return email.dateErrored.relative ?? "";
  if (email.meta.isSent) return email.dateSent.relative ?? "";
  return "";
}

function openEmail(emailId: string) {
  router.push({
    name: "account.email-history.scoped.view",
    params: { emailId }
  });
}
</script>

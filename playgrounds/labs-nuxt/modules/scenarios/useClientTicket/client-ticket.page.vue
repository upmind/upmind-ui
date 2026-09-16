<template>
  <Page :data-attrs="{ 'data-test-key': 'client-ticket-page' }">
    <PageHeader>
      <PageTitle>{{ t("labs.client_ticket_title") }}</PageTitle>
      <PageDescription>
        {{ t("labs.client_ticket_description") }}
      </PageDescription>
    </PageHeader>

    <PageBody class="gap-8">
      <!-- No ticket in the url — offer the id that addresses one. -->
      <Card v-if="!ticketId" size="sm" class="gap-4">
        <EmptyState
          :title="t('labs.client_ticket_needs_id')"
          :description="t('labs.client_ticket_needs_id_text')"
        >
          <template #icon><Icon icon="message-question-circle" /></template>
        </EmptyState>
        <div class="flex items-end gap-3">
          <Input
            v-model="idInput"
            :placeholder="t('labs.client_ticket_id_label')"
            :data-attrs="{ 'data-test-key': 'ticket-id-input' }"
            @keyup.enter="openTicket"
          />
          <Button
            :disabled="!idInput.trim()"
            :data-attrs="{ 'data-test-key': 'ticket-open' }"
            @click="openTicket"
          >
            {{ t("labs.client_ticket_open") }}
          </Button>
        </div>
      </Card>

      <!-- Booting the addressed ticket. -->
      <div v-else-if="booting" class="flex justify-center p-8">
        <Spinner :label="t('text.loading')" />
      </div>

      <!-- The read failed for this session — the manager's own error, as state. -->
      <Alert
        v-else-if="!isReadable"
        variant="danger"
        appearance="outline"
        :title="t('labs.client_ticket_unavailable')"
        :description="readError || t('labs.client_ticket_unavailable_text')"
        :data-attrs="{ 'data-test-key': 'ticket-unavailable' }"
      />

      <template v-else>
        <!-- Meta: the record's identity and its per-record flags. -->
        <Card size="sm" class="gap-4">
          <div class="flex flex-wrap items-center gap-3">
            <span
              class="text-lg font-semibold"
              data-test-key="ticket-reference"
            >
              {{ ticket?.reference }}
            </span>
            <StatusBadge size="sm" tone="neutral" data-test-key="ticket-status">
              {{ ticket?.status?.name }}
            </StatusBadge>
            <Badge
              v-if="meta?.isClosed.value"
              size="sm"
              appearance="muted"
              data-test-key="ticket-meta-closed"
            >
              {{ t("labs.client_ticket_meta_closed") }}
            </Badge>
            <Badge
              v-if="meta?.isLocked.value"
              size="sm"
              appearance="muted"
              data-test-key="ticket-meta-locked"
            >
              {{ t("labs.client_ticket_meta_locked") }}
            </Badge>
            <Badge
              v-if="meta?.isDelegated.value"
              size="sm"
              appearance="muted"
              data-test-key="ticket-meta-delegated"
            >
              {{ t("labs.client_ticket_meta_delegated") }}
            </Badge>
            <Badge
              v-if="meta?.canReply.value"
              size="sm"
              appearance="muted"
              data-test-key="ticket-meta-can-reply"
            >
              {{ t("labs.client_ticket_meta_can_reply") }}
            </Badge>
          </div>

          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div v-if="department">
              <dt class="text-faint">
                {{ t("labs.client_ticket_department") }}
              </dt>
              <dd>{{ department.name }}</dd>
            </div>
            <div v-if="relatedProduct">
              <dt class="text-faint">
                {{ t("labs.client_ticket_product") }}
              </dt>
              <dd>{{ relatedProduct.product_name }}</dd>
            </div>
          </dl>

          <!-- Subject editor — refused (disabled) when the ticket is locked. -->
          <div class="flex items-end gap-3">
            <label class="flex-1">
              <span class="text-faint text-sm">
                {{ t("labs.client_ticket_subject_label") }}
              </span>
              <Input
                v-model="subjectDraft"
                :disabled="meta?.isLocked.value || pending"
                :data-attrs="{ 'data-test-key': 'ticket-subject-input' }"
              />
            </label>
            <Button
              variant="outline"
              :disabled="
                meta?.isLocked.value ||
                pending ||
                !subjectDraft.trim() ||
                subjectDraft === ticket?.subject
              "
              :data-attrs="{ 'data-test-key': 'ticket-subject-save' }"
              @click="saveSubject"
            >
              {{ t("labs.client_ticket_subject_save") }}
            </Button>
          </div>

          <!-- Lifecycle — close when open (and unlocked), reopen when closed. -->
          <div class="flex gap-3">
            <Button
              v-if="!meta?.isClosed.value"
              variant="outline"
              :disabled="meta?.isLocked.value || pending"
              :data-attrs="{ 'data-test-key': 'ticket-close' }"
              @click="closeTicket"
            >
              {{ t("labs.client_ticket_close") }}
            </Button>
            <Button
              v-else
              variant="outline"
              :disabled="pending"
              :data-attrs="{ 'data-test-key': 'ticket-reopen' }"
              @click="reopenTicket"
            >
              {{ t("labs.client_ticket_reopen") }}
            </Button>
            <Button
              variant="ghost"
              :disabled="feedLoading"
              :data-attrs="{ 'data-test-key': 'ticket-refresh' }"
              @click="refresh"
            >
              {{ t("action.refresh") }}
            </Button>
          </div>
        </Card>

        <!-- A failed action says so beside the controls that made it. -->
        <Alert
          v-if="actionError"
          variant="danger"
          appearance="muted"
          :title="actionError"
          :data-attrs="{ 'data-test-key': 'ticket-action-error' }"
        />

        <!-- The merged message + status-log thread. -->
        <Card size="sm" class="gap-4">
          <div class="flex items-center justify-between">
            <span class="font-medium">{{
              t("labs.client_ticket_thread")
            }}</span>
            <div class="flex gap-2">
              <Button
                v-if="feed?.hasOlder.value"
                size="sm"
                variant="ghost"
                :disabled="feedLoading"
                :data-attrs="{ 'data-test-key': 'ticket-load-older' }"
                @click="loadOlder"
              >
                {{ t("labs.client_ticket_load_older") }}
              </Button>
              <Button
                v-if="feed?.hasNewer.value"
                size="sm"
                variant="ghost"
                :disabled="feedLoading"
                :data-attrs="{ 'data-test-key': 'ticket-load-newer' }"
                @click="loadNewer"
              >
                {{ t("labs.client_ticket_load_newer") }}
              </Button>
            </div>
          </div>

          <EmptyState
            v-if="!entries.length"
            :title="t('labs.client_ticket_thread_empty')"
            :description="t('labs.client_ticket_thread_empty_text')"
          >
            <template #icon><Icon icon="message-question-circle" /></template>
          </EmptyState>

          <ul v-else class="flex flex-col gap-3" data-test-key="ticket-thread">
            <li
              v-for="(entry, index) in entries"
              :key="index"
              data-test-key="ticket-thread-entry"
            >
              <div v-if="entry.kind === 'message'" class="flex flex-col gap-1">
                <div class="flex items-center gap-2 text-sm">
                  <span class="font-medium">{{
                    entry.message.actor_name
                  }}</span>
                  <span class="text-faint">{{ entry.message.created_at }}</span>
                  <Badge
                    v-if="entry.message.is_private"
                    size="sm"
                    appearance="muted"
                  >
                    {{ t("labs.client_ticket_private_label") }}
                  </Badge>
                  <Badge
                    v-if="entry.message.files?.length"
                    size="sm"
                    appearance="muted"
                  >
                    {{
                      t("labs.client_ticket_files_count", {
                        count: entry.message.files.length
                      })
                    }}
                  </Badge>
                </div>
                <p class="text-sm" data-test-key="ticket-message-body">
                  {{ entry.message.body }}
                </p>
              </div>
              <p
                v-else
                class="text-faint text-sm"
                data-test-key="ticket-log-entry"
              >
                {{
                  t("labs.client_ticket_log_status", {
                    status: entry.log.statusCode
                  })
                }}
              </p>
            </li>
          </ul>
        </Card>

        <!-- Reply composer — disabled when the ticket refuses replies. -->
        <Card size="sm" class="gap-3">
          <Textarea
            v-model="replyBody"
            :rows="3"
            :placeholder="t('labs.client_ticket_reply_placeholder')"
            :data-attrs="{ 'data-test-key': 'ticket-reply-input' }"
          />
          <div class="flex justify-end">
            <Button
              :disabled="!meta?.canReply.value || !replyBody.trim() || pending"
              :data-attrs="{ 'data-test-key': 'ticket-reply-send' }"
              @click="send"
            >
              {{ t("labs.client_ticket_send") }}
            </Button>
          </div>
        </Card>
      </template>
    </PageBody>
  </Page>
</template>

<script lang="ts" setup>
/**
 * @module scenarios/useClientTicket/client-ticket.page
 * @description The client×self ticket MANAGER, drawn directly. It boots
 * `useClientTicket().as(ScopeActorTypes.CLIENT).for(TicketContextTypes.TICKET, id)`
 * (R11 — enum members, no cast) from the id the scope suffix carries, and
 * drives the manager's own members: the merged thread (`loadOlder`/`loadNewer`),
 * the reply composer (`reply`), the close/reopen lifecycle (`close`/`reopen`),
 * the subject editor (`setSubject`) and `refresh`, each gated by the record's
 * own meta (`isLocked`/`isClosed`/`canReply`).
 *
 * NOT drawn, and named rather than faked: the per-message writes
 * (`editMessage`, `deleteMessage`, `deleteAttachment`, `downloadAttachment`,
 * `getMessage`) and the attachment/product writes (`uploadAttachment`,
 * `loadAttachments`, `setRelatedProduct`, `removeRelatedProduct`). Each needs
 * a message-level or file-level control surface (a selected message id, a file
 * picker) beyond this page's load/read/reply/lifecycle/subject remit; the
 * manager can do them, this page does not yet offer the control. `invalidate`
 * is internal plumbing, and `destroy` runs on unmount.
 */

import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Page,
  PageBody,
  PageDescription,
  PageHeader,
  PageTitle,
  Spinner,
  StatusBadge,
  Textarea
} from "@upmind/ui";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  Icon,
  ScopeActorTypes,
  TicketContextTypes,
  useClientTicket
} from "@upmind-automation/client-vue";
import { useContextScope } from "~/composables/scope";

// NO `name`, `path` or `nav` here: the registrar owns all three, off the
// declaration beside this file. `key` keys by the whole url, so addressing a
// different ticket remounts a fresh manager.
definePageMeta({
  key: route => route.fullPath
});

const { t } = useI18n();
const router = useRouter();

const contextScope = useContextScope<`${TicketContextTypes}`>();
const ticketId = computed(() =>
  contextScope.value?.type === TicketContextTypes.TICKET
    ? contextScope.value.id
    : undefined
);

// Booted once per mount — the page remounts per url (see `definePageMeta`), so
// the id is fixed here. `.as(CLIENT)` is the only actor `TICKET_SCOPE_MATRIX`
// serves; this IS the client×self cell, never `.for('client', id)`.
const manager = ticketId.value
  ? useClientTicket()
      .as(ScopeActorTypes.CLIENT)
      .for(TicketContextTypes.TICKET, ticketId.value)
  : undefined;

const actions = manager?.useActions();
const context = manager?.useContext();
const meta = manager?.useMeta();

const ticket = computed(() => context?.data.value);
const department = computed(() => context?.department.value);
const relatedProduct = computed(() => context?.relatedProduct.value);
const feed = context?.feed;
const entries = computed(() => feed?.entries.value ?? []);
const readError = computed(() => context?.error.value?.message);

const booting = ref(true);
const feedLoading = ref(false);
const pending = ref(false);
const actionError = ref<string>();
const idInput = ref("");
const replyBody = ref("");
const subjectDraft = ref("");

// Readable once the read has settled with a record and no error — the manager
// resolves its target from the active session, so an unaddressable scope (no
// client session) settles here instead of throwing.
const isReadable = computed(() => !!ticket.value && !meta?.hasError.value);

// Seed the subject draft from the loaded ticket, once.
watch(
  () => ticket.value?.subject,
  subject => {
    if (subject != null && !subjectDraft.value) subjectDraft.value = subject;
  }
);

function openTicket(): void {
  const id = idInput.value.trim();
  if (!id) return;
  router.push(`/useClientTicket/as/client/for/ticket/${id}`);
}

function report(error: unknown): void {
  actionError.value =
    (error as { message?: string })?.message ?? t("error.something_went_wrong");
}

async function run(work: () => Promise<unknown>): Promise<void> {
  pending.value = true;
  actionError.value = undefined;
  try {
    await work();
  } catch (error) {
    report(error);
  } finally {
    pending.value = false;
  }
}

async function loadThread(): Promise<void> {
  if (!actions) return;
  feedLoading.value = true;
  try {
    await actions.loadOlder();
  } catch (error) {
    report(error);
  } finally {
    feedLoading.value = false;
  }
}

const send = () =>
  run(async () => {
    await actions?.reply(replyBody.value);
    replyBody.value = "";
  });
const saveSubject = () => run(() => actions!.setSubject(subjectDraft.value));
const closeTicket = () => run(() => actions!.close());
const reopenTicket = () => run(() => actions!.reopen());
const loadOlder = () => loadThread();

async function loadNewer(): Promise<void> {
  if (!actions) return;
  feedLoading.value = true;
  try {
    await actions.loadNewer();
  } catch (error) {
    report(error);
  } finally {
    feedLoading.value = false;
  }
}

async function refresh(): Promise<void> {
  if (!actions) return;
  feedLoading.value = true;
  try {
    await actions.refresh();
  } catch (error) {
    report(error);
  } finally {
    feedLoading.value = false;
  }
}

onMounted(async () => {
  if (!actions) {
    booting.value = false;
    return;
  }
  await actions.isReady();
  await loadThread();
  booting.value = false;
});

onUnmounted(() => actions?.destroy());
</script>

<template>
  <Page :data-attrs="{ 'data-test-key': 'client-ticket-page' }">
    <PageHeader>
      <PageTitle>{{ t("labs.client_ticket_title") }}</PageTitle>
      <PageDescription>
        {{ t("labs.client_ticket_description") }}
      </PageDescription>
    </PageHeader>

    <!-- The page's OWN scenario bar. A self-drawn page mounts no
         `ScenarioPlayground`, so it mounts the standalone bar directly over the
         same transport the shared host builds (`useScenarioTransport`) — one
         wiring, two hosts. It is a descendant of this page's content root
         rather than of the app chrome (`G9`, `AC2.1`): scenarios are
         page-scoped. -->
    <ScenarioBar :player="player" :tracks="tracks" :states="states" />

    <PageBody class="relative gap-8">
      <!-- No ticket in the url — offer the id that addresses one. -->
      <Card v-if="!ticketId" size="sm" class="gap-4">
        <EmptyState
          :title="t('labs.client_ticket_needs_id')"
          :description="t('labs.client_ticket_needs_id_text')"
        >
          <template #icon><Icon icon="message-question-circle" /></template>
        </EmptyState>
        <!-- FIND a ticket. The module's OWN lookups pair, its control already
             bound to this scope's service (`schemas.lookups`) — the same shape
             `useInvoices` publishes for the `.for()` picker, rendered here by
             the same form. The pick IS the write: selecting a row writes the
             ticket's id, and this page navigates to it. -->
        <div v-if="pickerForm" class="w-full" data-test-key="ticket-lookup">
          <UpmForm
            :schema="pickerForm.schema"
            :uischema="pickerForm.uischema"
            :model-value="pickerModel"
            :additional-renderers="formRenderers"
            no-actions
            size="sm"
            @update:model-value="onTicketPick"
          />
        </div>

        <!-- ...or address one directly, for a reference read off a listing or
             an id pasted from a url. -->
        <div class="flex items-end gap-3">
          <Input
            v-model="idInput"
            :placeholder="t('labs.client_ticket_id_label')"
            :data-attrs="{ 'data-test-key': 'ticket-id-input' }"
            @keyup.enter="openTicket"
          />
          <Button
            :disabled="!idInput.trim() || resolving"
            :loading="resolving"
            :data-attrs="{ 'data-test-key': 'ticket-open' }"
            @click="openTicket"
          >
            {{ t("labs.client_ticket_open") }}
          </Button>
        </div>

        <!-- A pasted reference that matches no ticket — distinct from the
             url-addressed read failure below (`ticket-unavailable`). -->
        <Alert
          v-if="notFoundReference"
          variant="warning"
          appearance="outline"
          :title="t('labs.client_ticket_not_found')"
          :description="
            t('labs.client_ticket_not_found_text', {
              reference: notFoundReference
            })
          "
          :data-attrs="{ 'data-test-key': 'ticket-not-found' }"
        />
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
              <dd data-test-key="ticket-product-name">
                {{ relatedProduct.product_name }}
              </dd>
            </div>
          </dl>

          <!-- Subject editor — refused (disabled) when the ticket is locked. -->
          <div class="flex items-end gap-3 pt-2">
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

          <!-- AC13 — the related product, linked/changed by contract-product id
               and unlinked with the module's own explicit null. Both writes are
               gated on the LOCK: legacy refuses them on a locked ticket
               (`ticketProvider.ts:283,:299`), the same list the close and
               subject writes sit on. The id is typed rather than picked: this
               page binds no product lookup, and inventing a picker over a
               composable it does not boot would draw a control the runtime
               cannot fire. -->
          <div class="flex flex-wrap items-end gap-3 pt-2">
            <label class="flex-1">
              <span class="text-faint text-sm">
                {{ t("labs.client_ticket_product_label") }}
              </span>
              <Input
                v-model="productIdDraft"
                :disabled="meta?.isLocked.value || pending"
                :data-attrs="{ 'data-test-key': 'ticket-product-input' }"
              />
            </label>
            <Button
              variant="outline"
              :disabled="
                meta?.isLocked.value || pending || !productIdDraft.trim()
              "
              :data-attrs="{ 'data-test-key': 'ticket-product-link' }"
              @click="linkProduct"
            >
              {{ t("labs.client_ticket_product_link") }}
            </Button>
            <Button
              v-if="relatedProduct"
              variant="outline"
              :disabled="meta?.isLocked.value || pending"
              :data-attrs="{ 'data-test-key': 'ticket-product-unlink' }"
              @click="unlinkProduct"
            >
              {{ t("labs.client_ticket_product_unlink") }}
            </Button>
          </div>

          <!-- Lifecycle — close when open (and unlocked), reopen when closed. -->
          <div class="flex flex-wrap gap-3 pt-4">
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

          <!-- AC15 — All / Attachments over the SAME feed. The attachments
               view is a different REQUEST (`filter[files.id|gt]=0`), never a
               client-side filter over rows already held. -->
          <Tabs
            :tabs="feedTabs"
            :model-value="feedView"
            :data-attrs="{ 'data-test-key': 'ticket-view-tabs' }"
            @update:model-value="selectView"
          />

          <!-- AC20's outcome, kept on screen: the bytes the manager handed
               back, by name and length. Nothing else in this lane can show a
               download happened at all. -->
          <Alert
            v-if="downloaded"
            variant="info"
            appearance="muted"
            :title="
              t('labs.client_ticket_attachment_downloaded', {
                name: downloaded.name,
                bytes: downloaded.bytes
              })
            "
            :data-attrs="{
              'data-test-key': 'ticket-attachment-downloaded',
              'data-test-value': downloaded.bytes
            }"
          />

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
              <div v-if="entry.kind === 'message'" class="flex flex-col gap-2">
                <div class="flex flex-wrap items-center gap-2 text-sm">
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

                <!-- AC20/AC21 — one menu per attached file. -->
                <div
                  v-if="entry.message.files?.length"
                  class="flex flex-wrap gap-2"
                >
                  <DropdownMenuRoot
                    v-for="file in entry.message.files"
                    :key="file.id"
                  >
                    <DropdownMenuTrigger as-child>
                      <Button
                        size="sm"
                        variant="outline"
                        :disabled="pending"
                        :data-attrs="{
                          'data-test-key': 'ticket-attachment-menu',
                          'data-test-value': file.id
                        }"
                      >
                        <Icon
                          icon="file-attachment-01"
                          size="nano"
                          aria-hidden="true"
                        />
                        {{ file.name }}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        data-test-key="ticket-attachment-download"
                        :data-test-value="file.id"
                        @select="downloadFile(file)"
                      >
                        {{ t("labs.client_ticket_attachment_download") }}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        data-test-key="ticket-attachment-copy"
                        :data-test-value="file.id"
                        @select="copyFileName(file)"
                      >
                        {{ t("labs.client_ticket_attachment_copy") }}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        data-test-key="ticket-attachment-delete"
                        :data-test-value="file.id"
                        @select="removeFile(entry.message.id, file.id)"
                      >
                        {{ t("labs.client_ticket_attachment_delete") }}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenuRoot>
                </div>

                <!-- AC16/AC18/AC19 — the per-message writes, offered only on a
                     message this actor's OWN `can_manage` allows. The module
                     refuses the write regardless; the page does not draw a
                     control it knows the runtime will refuse. -->
                <div class="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    :disabled="pending"
                    :data-attrs="{
                      'data-test-key': 'ticket-message-reload',
                      'data-test-value': entry.message.id
                    }"
                    @click="reloadMessage(entry.message.id)"
                  >
                    {{ t("labs.client_ticket_message_reload") }}
                  </Button>
                  <Button
                    v-if="entry.message.can_manage"
                    size="sm"
                    variant="ghost"
                    :disabled="pending"
                    :data-attrs="{
                      'data-test-key': 'ticket-message-edit',
                      'data-test-value': entry.message.id
                    }"
                    @click="startEdit(entry.message)"
                  >
                    {{ t("labs.client_ticket_message_edit") }}
                  </Button>
                  <Button
                    v-if="entry.message.can_manage"
                    size="sm"
                    variant="ghost"
                    :disabled="pending"
                    :data-attrs="{
                      'data-test-key': 'ticket-message-delete',
                      'data-test-value': entry.message.id
                    }"
                    @click="startWithdraw(entry.message)"
                  >
                    {{ t("labs.client_ticket_message_delete") }}
                  </Button>
                </div>

                <!-- AC18 — correcting this message in place. -->
                <div
                  v-if="editingId === entry.message.id"
                  class="flex flex-col gap-2 pt-2"
                >
                  <Textarea
                    v-model="editDraft"
                    :rows="3"
                    data-test-key="ticket-message-edit-input"
                  />
                  <div class="flex justify-end gap-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      :data-attrs="{
                        'data-test-key': 'ticket-message-edit-cancel'
                      }"
                      @click="editingId = undefined"
                    >
                      {{ t("action.cancel") }}
                    </Button>
                    <Button
                      size="sm"
                      :disabled="!editDraft.trim() || pending"
                      :data-attrs="{
                        'data-test-key': 'ticket-message-edit-save'
                      }"
                      @click="saveEdit(entry.message.id)"
                    >
                      {{ t("labs.client_ticket_message_edit_save") }}
                    </Button>
                  </div>
                </div>

                <!-- AC19 — withdrawal carries a REASON, which the wire keeps. -->
                <div
                  v-if="withdrawingId === entry.message.id"
                  class="flex flex-col gap-2 pt-2"
                >
                  <Input
                    v-model="withdrawReason"
                    :placeholder="
                      t('labs.client_ticket_message_delete_reason_label')
                    "
                    :data-attrs="{
                      'data-test-key': 'ticket-message-delete-reason'
                    }"
                  />
                  <div class="flex justify-end gap-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      :data-attrs="{
                        'data-test-key': 'ticket-message-delete-cancel'
                      }"
                      @click="withdrawingId = undefined"
                    >
                      {{ t("action.cancel") }}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      :disabled="!withdrawReason.trim() || pending"
                      :data-attrs="{
                        'data-test-key': 'ticket-message-delete-confirm'
                      }"
                      @click="confirmWithdraw(entry.message.id)"
                    >
                      {{ t("labs.client_ticket_message_delete_confirm") }}
                    </Button>
                  </div>
                </div>
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
        <Card size="sm" class="gap-4">
          <!-- AC17 — the stale-reply caution. A refused reply is NOT a
               failure and NOT a success: the draft is still here, and this
               says so beside it rather than letting an emptied box claim the
               message was posted. -->
          <Alert
            v-if="actionNotice"
            variant="warning"
            appearance="muted"
            :title="actionNotice"
            :data-attrs="{ 'data-test-key': 'ticket-reply-stale' }"
          />

          <Textarea
            v-model="replyBody"
            :rows="3"
            :placeholder="t('labs.client_ticket_reply_placeholder')"
            data-test-key="ticket-reply-input"
          />

          <!-- AC23 — every picked file is uploaded FIRST, and the refs the
               upload returns ride out on the reply itself. -->
          <div class="flex flex-wrap items-center gap-3 pt-2">
            <input
              type="file"
              multiple
              class="text-sm"
              data-test-key="ticket-reply-attach"
              :disabled="!meta?.canReply.value || uploading || pending"
              :aria-label="t('labs.client_ticket_attach')"
              @change="pickFiles"
            />
            <Spinner v-if="uploading" :label="t('text.loading')" size="sm" />
            <Badge
              v-for="file in pendingFiles"
              :key="file.id"
              size="sm"
              appearance="muted"
              data-test-key="ticket-reply-attachment"
              :data-test-value="file.id"
            >
              {{ file.name }}
            </Badge>
            <Button
              v-if="pendingFiles.length"
              size="sm"
              variant="ghost"
              :data-attrs="{ 'data-test-key': 'ticket-reply-attach-clear' }"
              @click="pendingFiles = []"
            >
              {{ t("action.clear") }}
            </Button>
          </div>

          <div class="flex justify-end pt-2">
            <Button
              :disabled="
                !meta?.canReply.value ||
                (!replyBody.trim() && !pendingFiles.length) ||
                uploading ||
                pending
              "
              :data-attrs="{ 'data-test-key': 'ticket-reply-send' }"
              @click="send"
            >
              {{ t("labs.client_ticket_send") }}
            </Button>
          </div>
        </Card>
      </template>

      <!-- While a scenario plays or a forced state is armed, the page content
           is the SCRIPT's: a transparent scrim takes every click off it, the
           bar above stays the operator's, and Live lifts it (`R6-23`). -->
      <div
        v-if="isLocked"
        :class="scenarioPlayground.scrim()"
        :title="t('labs.replay_locked')"
        aria-hidden="true"
        data-test-key="replay-scrim"
      />
    </PageBody>
  </Page>
</template>

<script lang="ts" setup>
/**
 * @module scenarios/useClientTicket/client-ticket.page
 * @description The client×self ticket MANAGER, drawn directly. It boots
 * `useClientTicket().as(ScopeActorTypes.CLIENT).for(TicketContextTypes.TICKET, id)`
 * (R11 — enum members, no cast) from the id the scope suffix carries, and
 * drives the manager's own members: the merged thread (`loadOlder`/`loadNewer`)
 * and its attachments view (`loadAttachments`), the reply composer (`reply`)
 * with its uploads (`uploadAttachment`), the per-message writes (`getMessage`,
 * `editMessage`, `deleteMessage`), the per-attachment writes
 * (`downloadAttachment`, `deleteAttachment`), the related-product link
 * (`setRelatedProduct`/`removeRelatedProduct`), the close/reopen lifecycle
 * (`close`/`reopen`), the subject editor (`setSubject`) and `refresh` — each
 * gated by the record's own meta (`isLocked`/`isClosed`/`canReply`) or, for the
 * per-message writes, by that message's own `can_manage`.
 *
 * NOT drawn, and named rather than faked:
 *
 * - `invalidate` is internal plumbing, and `destroy` runs on unmount.
 * - **A from-the-top feed reload.** The manager exposes `loadOlder` /
 *   `loadNewer` (both id-cursor paging off the feed's current oldest/newest
 *   entry) and `loadAttachments`; there is no member that re-reads the whole
 *   thread unconditionally. So the All tab fires `loadOlder` — the very call
 *   this page boots the thread with — which, returning from the attachments
 *   view, pages back from the oldest attachment-bearing message rather than
 *   from the thread head. A module-side gap, named here rather than papered
 *   over with a client-side filter.
 * - **Delegate access.** Legacy draws it on the ticket; it is legacy row 43,
 *   owned by FE-3041 (DG-2), and OUT OF SCOPE for FE-3226. Its absence here is
 *   deliberate — do not "fix" it into this page.
 *
 * ## The upload branch this page cannot claim
 * `uploadAttachment` refuses on two grounds: the 25 MiB ceiling
 * (`TICKET_ATTACHMENT_MAX_BYTES`, 26214399) and the brand's
 * `ALLOWED_UPLOAD_FILE_TYPES`. Only the SIZE refusal is proven on this brand —
 * staging exposes no allowed-types setting, so that branch stays coded and
 * UNVERIFIED. Nothing here may be read as evidence it works.
 */

import {
  Alert,
  Badge,
  Button,
  Card,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  EmptyState,
  Input,
  Page,
  PageBody,
  PageDescription,
  PageHeader,
  PageTitle,
  Spinner,
  StatusBadge,
  Tabs,
  Textarea
} from "@upmind/ui";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  formRenderers,
  Icon,
  ScopeActorTypes,
  TicketContextTypes,
  UpmForm,
  resolveSelfActor,
  useClientTicket,
  useClientTickets
} from "@upmind-automation/client-vue";
import ScenarioBar from "../runtime/components/ScenarioBar.vue";
import { useScenarioTransport } from "../runtime/composables/useScenarioTransport";
import { useScenarioWorld } from "../runtime/composables/useScenarioWorld";
import { registry } from "../runtime/registry";
import { scenarioPlayground } from "../runtime/ScenarioPlayground.styles";
import scenario, { CLIENT_TICKET_SCENARIO } from "./client-ticket.scenario";
import type { TabItem } from "@upmind/ui";
import type {
  TicketAttachmentRef,
  TicketMessage
} from "@upmind-automation/client-vue";
import type { ScopeActor } from "@upmind-automation/scenario-harness";
import { useActorScope, useContextScope } from "~/composables/scope";

// NO `name`, `path` or `nav` here: the registrar owns all three, off the
// declaration beside this file.
//
// Keyed by PATH, never `fullPath`: the ticket id is a SCOPE SEGMENT
// (`/for/ticket/<id>`), so the path alone already remounts a fresh manager for
// a different ticket — while the QUERY, which the scenario transport writes
// `track=`, `scene=` and `force=` into, must not. A `fullPath` key tore the
// page down on every scene the player advanced.
definePageMeta({
  key: route => route.path
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

// --- The page's own scenario transport (FE-3226)
/**
 * A SELF-DRAWN page hosting its own scenario bar. Two seams are handed in, and
 * both exist for the same fact: this page is addressed by a url CONTEXT
 * (`/for/ticket/<id>`) that no step catalog can name.
 *
 * - **The world** is told which key this page HOSTS. `client_ticket`'s boot
 *   scope then completes from the url this page already read, so the world
 *   adopts the very cell above rather than booting a second one at a second
 *   scope — and never destroys it, because the page owns it (`onUnmounted`).
 * - **The page scope** the player compares a track's declared scope against is
 *   the ACTOR alone. Every track in this module's playlist declares
 *   `{ actor: client }` and no context (its Background boots the collection,
 *   and the manager's own arrangements boot contextless), so reporting the
 *   ticket here would make every track "foreign" and send the player
 *   navigating to a manager url with no ticket in it.
 *
 * The transport is the SAME wiring `ScenarioPlayground` builds — playlist,
 * forced-state offer, one player (`S19`) — reached through the composable both
 * hosts share, never a second copy.
 */
const actorScope = useActorScope();

const { tracks, states, player, isLocked } = useScenarioTransport({
  module: scenario.tracks,
  world: useScenarioWorld(registry, {
    key: CLIENT_TICKET_SCENARIO,
    context: contextScope.value
  }),
  scope: () => ({ actor: resolveSelfActor(actorScope.value) as ScopeActor })
});

const ticket = computed(() => context?.data.value);
const department = computed(() => context?.department.value);
const relatedProduct = computed(() => context?.relatedProduct.value);
const feed = context?.feed;
const entries = computed(() => feed?.entries.value ?? []);
const readError = computed(() => context?.error.value?.message);

const booting = ref(true);
const feedLoading = ref(false);
const pending = ref(false);
const uploading = ref(false);
const actionError = ref<string>();
/**
 * A refusal that is NOT a failure — the AC17 stale-reply caution, which the
 * module resolves without throwing. It rides its own ref so it reads as a
 * warning beside the composer rather than as the danger alert a real failure
 * raises.
 */
const actionNotice = ref<string>();
const idInput = ref("");
const replyBody = ref("");
const subjectDraft = ref("");
const productIdDraft = ref("");
const pendingFiles = ref<TicketAttachmentRef[]>([]);
const editingId = ref<string>();
const editDraft = ref("");
const withdrawingId = ref<string>();
const withdrawReason = ref("");
const downloaded = ref<{ name: string; bytes: number }>();

/** The two feed views AC15 names — `all` is the thread, `attachments` a different read. */
const FEED_VIEWS = { ALL: "all", ATTACHMENTS: "attachments" } as const;

const feedView = ref<string>(FEED_VIEWS.ALL);

const feedTabs = computed<TabItem[]>(() => [
  {
    value: FEED_VIEWS.ALL,
    label: t("labs.client_ticket_view_all"),
    dataAttrs: { "data-test-key": "ticket-view-all" }
  },
  {
    value: FEED_VIEWS.ATTACHMENTS,
    label: t("labs.client_ticket_view_attachments"),
    dataAttrs: { "data-test-key": "ticket-view-attachments" }
  }
]);

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

// A ticket id is a bare 8-4-4-4-12 hex string; a reference (e.g. `LHG-275-42348`)
// carries non-hex letters, so it never matches. Loose hex, not RFC-4122: the
// real ids carry non-standard version/variant nibbles.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const resolving = ref(false);
const notFoundReference = ref<string>();

// A stale not-found notice clears the moment the input changes.
watch(idInput, () => {
  notFoundReference.value = undefined;
});

/**
 * The picker's own collection instance. `.fresh()` for the same reason the
 * reference resolver below uses one — a picker search must never disturb a
 * live listing scope — and booted ONLY while no ticket is addressed, because
 * once one is, this card is gone and the lookup has nothing to offer.
 *
 * It publishes the pair rather than a list: `schemas.lookups` carries the
 * control with its service already bound, so this page renders a form and
 * reaches no service itself.
 */
const picker = ticketId.value
  ? undefined
  : useClientTickets().as(ScopeActorTypes.SELF).fresh();

const pickerForm = picker?.useContext().schemas.lookups;

/** The picked id, held so the control draws its own selection back. */
const pickerModel = ref<{ ticket?: string | null }>({});

onUnmounted(() => picker?.useActions().destroy());

/**
 * A pick is a navigation. The lookup writes the ticket's ID — that is the
 * option's `value` (`mapTicketLookupItem`) and what the manager loads by — so
 * nothing is resolved here, unlike a pasted reference.
 */
function onTicketPick(next: { ticket?: string | null } | undefined): void {
  const picked = next?.ticket;
  pickerModel.value = { ticket: picked };
  if (picked) router.push(`/useClientTicket/as/client/for/ticket/${picked}`);
}

// A hand only ever sees a ticket's REFERENCE on the listing; the manager loads
// by id. Resolve a pasted reference through the module's OWN public surface —
// `useClientTickets` filtering by the bare-leaf EQUAL `reference` column (AC-5)
// — on a `.fresh()` instance so it never disturbs a live collection scope.
async function resolveReferenceToId(
  reference: string
): Promise<string | undefined> {
  const tickets = useClientTickets().as(ScopeActorTypes.SELF).fresh();
  const collection = tickets.useActions();
  try {
    collection.setCriteria({ filters: { reference } });
    await collection.isReady();
    return tickets.useContext().data.value[0]?.id;
  } finally {
    collection.destroy();
  }
}

async function openTicket(): Promise<void> {
  const input = idInput.value.trim();
  if (!input || resolving.value) return;

  // A typed id navigates unchanged — the behaviour this page always had.
  if (UUID_PATTERN.test(input)) {
    router.push(`/useClientTicket/as/client/for/ticket/${input}`);
    return;
  }

  resolving.value = true;
  notFoundReference.value = undefined;
  try {
    const id = await resolveReferenceToId(input);
    if (!id) {
      notFoundReference.value = input;
      return;
    }
    router.push(`/useClientTicket/as/client/for/ticket/${id}`);
  } finally {
    resolving.value = false;
  }
}

function report(error: unknown): void {
  actionError.value =
    (error as { message?: string })?.message ?? t("error.something_went_wrong");
}

async function run(work: () => Promise<unknown>): Promise<void> {
  pending.value = true;
  actionError.value = undefined;
  actionNotice.value = undefined;
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

/**
 * AC17 — the reply, and the ONE outcome that is neither a success nor a throw.
 * `reply()` resolves to `undefined` when the server refused with
 * `409 ticket_has_more_recent_reply` (support replied first): the module's own
 * ruling makes that a CAUTION, not an error, so nothing is thrown and the
 * message was NOT posted. Ignoring the return value cleared the composer and
 * reported success over a reply that never left — the operator's "it says it is
 * sent but in messages I have nothing".
 *
 * So the two outcomes are told apart by the value: a message means sent (clear
 * the composer), `undefined` means refused (keep the draft, say plainly that a
 * newer reply arrived and this one was not sent). The thread is already paged
 * forward by the manager itself on that path (`useClientTicket.actions.ts`
 * calls `loadNewer()` before returning `undefined`), so the newer reply is on
 * screen for the client to read before they send again — no second read is
 * issued here.
 */
const send = () =>
  run(async () => {
    // `actions!` like every sibling write: the composer only exists inside the
    // readable-ticket branch, so an absent manager here would be a mount bug,
    // not the AC17 refusal — and `?.` would quietly report it as one.
    const posted = await actions!.reply(
      replyBody.value,
      pendingFiles.value.length ? { files: pendingFiles.value } : {}
    );
    if (!posted) {
      actionNotice.value = t("labs.client_ticket_reply_stale");
      return;
    }
    replyBody.value = "";
    pendingFiles.value = [];
  });
const saveSubject = () => run(() => actions!.setSubject(subjectDraft.value));
const closeTicket = () => run(() => actions!.close());
const reopenTicket = () => run(() => actions!.reopen());
const loadOlder = () => loadThread();

const linkProduct = () =>
  run(async () => {
    await actions!.setRelatedProduct(productIdDraft.value.trim());
    productIdDraft.value = "";
  });
const unlinkProduct = () => run(() => actions!.removeRelatedProduct());

/** AC16 — re-reads ONE message; the manager swaps its row in the feed in place. */
const reloadMessage = (messageId: string) =>
  run(() => actions!.getMessage(messageId));

function startEdit(message: TicketMessage): void {
  withdrawingId.value = undefined;
  editingId.value = message.id;
  editDraft.value = message.body ?? "";
}

const saveEdit = (messageId: string) =>
  run(async () => {
    await actions!.editMessage(messageId, editDraft.value);
    editingId.value = undefined;
  });

function startWithdraw(message: TicketMessage): void {
  editingId.value = undefined;
  withdrawingId.value = message.id;
  withdrawReason.value = "";
}

const confirmWithdraw = (messageId: string) =>
  run(async () => {
    await actions!.deleteMessage(messageId, withdrawReason.value);
    withdrawingId.value = undefined;
  });

/** AC21 — drops one file off a message; the manager re-reads the feed after. */
const removeFile = (messageId: string, fileId: string) =>
  run(() => actions!.deleteAttachment(messageId, fileId));

/**
 * AC20 — the raw bytes, straight off the manager. The page holds them and
 * reports the size: this lane has no download sink, and handing the bytes to a
 * blob url would be a browser-only flourish the read-back could not grade.
 */
const downloadFile = (file: { id: string; name: string }) =>
  run(async () => {
    const bytes = await actions!.downloadAttachment(file.id);
    downloaded.value = { name: file.name, bytes: bytes.byteLength };
  });

/** Pure UI, no module member — legacy offers the same convenience. */
function copyFileName(file: { name: string }): void {
  void navigator?.clipboard?.writeText?.(file.name);
}

/**
 * AC23 — each picked file goes up through the manager BEFORE the reply, and the
 * ref it returns is what rides out on `reply({ files })`. The refusals (size,
 * and the unverified allowed-types branch) are the module's own: the page lets
 * them surface rather than re-deciding them here.
 */
async function pickFiles(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const chosen = [...(input.files ?? [])];
  if (!chosen.length || !actions) return;

  uploading.value = true;
  actionError.value = undefined;
  try {
    for (const file of chosen) {
      pendingFiles.value = [
        ...pendingFiles.value,
        await actions.uploadAttachment(file)
      ];
    }
  } catch (error) {
    report(error);
  } finally {
    uploading.value = false;
    try {
      input.value = "";
    } catch {
      // Some benches lock the picker's value; the selection simply stays put.
    }
  }
}

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

/** AC15 — the attachments view is its own REQUEST, never a filter over rows held. */
async function loadAttachments(): Promise<void> {
  if (!actions) return;
  feedLoading.value = true;
  try {
    await actions.loadAttachments();
  } catch (error) {
    report(error);
  } finally {
    feedLoading.value = false;
  }
}

function selectView(value: string | number): void {
  feedView.value = String(value);
  void (feedView.value === FEED_VIEWS.ATTACHMENTS
    ? loadAttachments()
    : loadThread());
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

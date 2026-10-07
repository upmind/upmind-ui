<template>
  <div :class="recordThread.root()" data-test-key="record-thread">
    <Tabs
      v-if="views.length"
      :tabs="views"
      :model-value="view"
      :data-attrs="{ 'data-test-key': 'record-thread-views' }"
      @update:model-value="selectView"
    />

    <Alert
      v-if="downloaded && section.download"
      variant="info"
      appearance="muted"
      :title="t(section.download.done, downloaded)"
      :data-attrs="{
        'data-test-key': 'record-thread-downloaded',
        'data-test-value': downloaded.bytes
      }"
    />

    <EmptyState
      v-if="!events.length"
      :title="t(section.empty.title)"
      :description="t(section.empty.text)"
    >
      <template v-if="section.icon" #icon
        ><Icon :icon="section.icon"
      /></template>
    </EmptyState>

    <Timeline
      v-else
      :items="events"
      size="sm"
      :data-attrs="{ 'data-test-key': 'record-thread-entries' }"
    >
      <template #event="{ event }">
        <template v-if="event.message">
          <div :class="recordThread.heading()">
            <span :class="recordThread.author()">{{ event.author }}</span>
            <span v-if="dateCell" :class="recordThread.date()">
              <CellDispatcher :element="dateCell" :row="event.message" />
            </span>
            <Badge
              v-for="badge in event.badges"
              :key="badge.key"
              size="sm"
              appearance="muted"
            >
              {{ badge.label }}
            </Badge>
            <div v-if="event.actions.length" :class="recordThread.links()">
              <Link
                v-for="item in event.actions"
                :key="item.name"
                :color="linkColor(item)"
                size="sm"
                :disabled="item.disabled || item.loading"
                :data-attrs="{
                  'data-test-key': `record-thread-${item.name}`,
                  'data-test-value': event.key
                }"
                @click="item.onSelect"
              >
                <Icon v-if="item.icon" :icon="item.icon" aria-hidden="true" />
                {{ item.label }}
              </Link>
            </div>
          </div>

          <div :class="recordThread.body()">
            <template
              v-for="element in section.message.body"
              :key="element.scope"
            >
              <CellDispatcher :element="element" :row="event.message" />
            </template>
          </div>

          <div v-if="event.files.length" :class="recordThread.files()">
            <DropdownMenu
              v-for="file in event.files"
              :key="file.id"
              :items="file.menu"
            >
              <template #trigger>
                <Button
                  size="sm"
                  variant="outline"
                  :disabled="isDisabled"
                  :data-attrs="{
                    'data-test-key': 'record-thread-file',
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
              </template>
              <template #item="{ item }">
                <span :data-test-value="item.dataAttrs?.['data-test-value']">
                  {{ item.label }}
                </span>
              </template>
            </DropdownMenu>
          </div>
        </template>
        <p v-else :class="recordThread.log()" data-test-key="record-thread-log">
          {{ event.description }}
        </p>
      </template>
    </Timeline>

    <div
      v-if="composer && allows?.(composer.gate) !== false"
      :class="recordThread.composer()"
      data-test-key="record-thread-composer"
    >
      <Alert
        v-if="refused"
        variant="warning"
        appearance="muted"
        :title="t(composer.i18n.refused)"
        :data-attrs="{ 'data-test-key': 'record-thread-refused' }"
      />

      <Textarea
        v-model="body"
        :rows="3"
        :placeholder="t(composer.i18n.placeholder)"
        :disabled="isDisabled"
        data-test-key="record-thread-reply"
      />

      <FileUploadRoot
        v-if="composer.upload"
        v-model="chosen"
        multiple
        :disabled="isDisabled"
        :class="recordThread.attachments()"
      >
        <div :class="recordThread.attachActions()">
          <FileUploadTrigger size="sm" data-test-key="record-thread-attach">
            <Icon icon="file-attachment-01" size="nano" aria-hidden="true" />
            {{ t(composer.i18n.attach) }}
          </FileUploadTrigger>
          <Button
            v-if="chosen.length"
            size="sm"
            variant="ghost"
            :disabled="isDisabled"
            :data-attrs="{ 'data-test-key': 'record-thread-attach-clear' }"
            @click="chosen = []"
          >
            {{ t("action.clear") }}
          </Button>
        </div>
        <ul v-if="chosen.length" :class="recordThread.uploads()">
          <FileUploadItem
            v-for="file in chosen"
            :key="fileKey(file)"
            :file="file"
            :status="uploads[fileKey(file)]?.status"
            :uploaded-label="t(composer.i18n.uploaded)"
            :failed-label="t(composer.i18n.failed)"
            data-test-key="record-thread-attachment"
            :data-test-value="uploads[fileKey(file)]?.ref?.id ?? file.name"
          />
        </ul>
      </FileUploadRoot>

      <div :class="recordThread.send()">
        <Tooltip
          :label="locked ? t('labs.replay_locked') : t(composer.i18n.submit)"
          :active="!!locked"
        >
          <Button
            size="sm"
            :disabled="
              isDisabled || isUploading || (!body.trim() && !attached.length)
            "
            :loading="sending"
            :data-attrs="{ 'data-test-key': 'record-thread-send' }"
            @click="send"
          >
            {{ t(composer.i18n.submit) }}
          </Button>
        </Tooltip>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/record/RecordThreadSection
 * @description The `thread` section kind — a conversation on the record, drawn
 * as a ui `Timeline`: each message with its author, date, badges, declared
 * body cells, its bound controls and a menu per attached file; each log entry
 * as one line. The declared views are reads the manager makes, and the reply
 * composer beneath uploads each picked file before it sends.
 *
 * Every write goes through the surface — bound declarations, or `invoke` for
 * a write taking arguments — so a busy surface disables the thread too and a
 * failure is said in the surface's one alert.
 */

import {
  Alert,
  Badge,
  Button,
  DropdownMenu,
  EmptyState,
  FileUploadItem,
  FileUploadRoot,
  FileUploadTrigger,
  fileKey,
  Link,
  Tabs,
  Textarea,
  Timeline,
  Tooltip
} from "@upmind/ui";
import { computed, ref, unref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Icon } from "@upmind-automation/foundation";
import { resolveScope } from "../../../scenario.utils";
import { CellDispatcher } from "../../cells";
import { recordThread } from "./record.styles";
import { linkColor } from "./record.utils";
import {
  compact,
  filter,
  find,
  forEach,
  get,
  isArray,
  isNil,
  kebabCase,
  map,
  pick,
  some,
  toString,
  values
} from "lodash-es";
import type {
  RecordSectionProps,
  RecordThreadEvent,
  RecordThreadUpload
} from "./record.types";
import type {
  RecordThreadSection,
  TableCellDate
} from "../../../scenario.types";
import type { MenuItem, TabItem } from "@upmind/ui";
// -----------------------------------------------------------------------------

const props = defineProps<RecordSectionProps<RecordThreadSection>>();

const { t } = useI18n();

const view = ref(props.section.views?.[0]?.value);
const body = ref("");
const chosen = ref<File[]>([]);
const uploads = ref<Record<string, RecordThreadUpload>>({});

const attached = computed(() =>
  compact(map(chosen.value, file => uploads.value[fileKey(file)]?.ref))
);

const isUploading = computed(() =>
  some(values(uploads.value), { status: "uploading" })
);
const sending = ref(false);
const refused = ref(false);
const downloaded = ref<{ name: string; bytes: number }>();

const composer = computed(() => props.section.composer);

const isDisabled = computed(() => !!props.locked || !!props.busy);

const dateCell = computed<TableCellDate | undefined>(() =>
  props.section.message.date
    ? { type: "TableCellDate", scope: props.section.message.date, i18n: "" }
    : undefined
);

const views = computed<TabItem[]>(() =>
  map(props.section.views, entry => ({
    value: entry.value,
    label: t(entry.i18n),
    disabled: isDisabled.value,
    dataAttrs: { "data-test-key": `record-thread-view-${entry.value}` }
  }))
);

function read(source: Record<string, unknown>, scope?: string): unknown {
  return scope ? unref(resolveScope(source, scope)) : undefined;
}

function textOf(value: unknown): string {
  return isNil(value) ? "" : toString(value);
}

/** Runs one write through the surface; its failure is already said there. */
async function attempt(name: string, ...args: unknown[]): Promise<unknown> {
  return Promise.resolve()
    .then(() => props.invoke?.(name, ...args))
    .catch(() => undefined);
}

function fileMenu(
  message: Record<string, unknown>,
  file: Record<string, unknown>
): MenuItem[] {
  const id = textOf(file.id);
  const name = textOf(file.name);
  const download = props.section.download;
  const copy = props.section.copyI18n;
  const bound = props.bind(props.section.message.fileActions ?? [], {
    ...file,
    messageId: message.id
  });

  return [
    ...(download
      ? [
          {
            label: t(download.i18n),
            value: "download",
            disabled: isDisabled.value,
            dataAttrs: { "data-test-value": `download-${id}` },
            onSelect: () => void downloadFile(download.run, id, name)
          }
        ]
      : []),
    ...(copy
      ? [
          {
            label: t(copy),
            value: "copy",
            dataAttrs: { "data-test-value": `copy-${id}` },
            onSelect: () => void navigator?.clipboard?.writeText?.(name)
          }
        ]
      : []),
    ...map(bound, item => ({
      label: item.label,
      value: item.name,
      disabled: item.disabled || item.loading,
      variant:
        linkColor(item) === "danger" ? ("destructive" as const) : undefined,
      dataAttrs: { "data-test-value": `${kebabCase(item.name)}-${id}` },
      onSelect: item.onSelect
    }))
  ];
}

const events = computed<RecordThreadEvent[]>(() => {
  const found = read(props.model, props.section.entries);
  const entries = (isArray(found) ? found : []) as Record<string, unknown>[];
  const { discriminator, message: shape, log } = props.section;

  return map(entries, (entry, index) => {
    const kind = read(entry, discriminator.scope);
    const message = read(entry, shape.scope) as
      | Record<string, unknown>
      | undefined;

    if (kind === discriminator.message && message) {
      const key = textOf(message.id ?? index);
      const files = read(message, shape.files);
      return {
        key,
        dataAttrs: {
          "data-test-key": "record-thread-entry",
          "data-test-value": key
        },
        message,
        author: textOf(read(message, shape.author)),
        badges: map(
          filter(shape.badges, badge =>
            badge.scope
              ? !!read(message, badge.scope)
              : !!get(message, badge.flag)
          ),
          badge => ({ key: kebabCase(badge.flag), label: t(badge.i18n) })
        ),
        actions: props.bind(shape.actions ?? [], message),
        files: map(
          (isArray(files) ? files : []) as Record<string, unknown>[],
          file => ({
            id: textOf(file.id),
            name: textOf(file.name),
            menu: fileMenu(message, file)
          })
        )
      };
    }

    const line = log
      ? (read(entry, log.scope) as Record<string, unknown> | undefined)
      : undefined;
    return {
      key: String(index),
      description:
        log && line
          ? t(log.i18n, { value: textOf(read(line, log.value)) })
          : undefined,
      dataAttrs: {
        "data-test-key": "record-thread-entry",
        "data-test-value": String(index)
      },
      badges: [],
      actions: [],
      files: []
    };
  });
});

async function selectView(value: string | number): Promise<void> {
  const next = String(value);
  const entry = find(props.section.views, { value: next });
  view.value = next;
  if (entry) await attempt(entry.run);
}

async function downloadFile(
  run: string,
  id: string,
  name: string
): Promise<void> {
  downloaded.value = undefined;
  const bytes = (await attempt(run, id)) as ArrayBuffer | undefined;
  if (bytes) downloaded.value = { name, bytes: bytes.byteLength };
}

// Each file the picker adds goes up once; a file removed drops its ref.
watch(chosen, files => {
  const upload = composer.value?.upload;
  const live = map(files, fileKey);
  uploads.value = pick(uploads.value, live);
  if (!upload) return;
  forEach(files, file => {
    const key = fileKey(file);
    if (uploads.value[key]) return;
    uploads.value = { ...uploads.value, [key]: { status: "uploading" } };
    void attempt(upload, file).then(result => {
      if (!uploads.value[key]) return;
      const ref = result as { id: string; name: string } | undefined;
      uploads.value = {
        ...uploads.value,
        [key]: ref ? { status: "success", ref } : { status: "error" }
      };
    });
  });
});

async function send(): Promise<void> {
  const submit = composer.value?.submit;
  if (!submit) return;

  sending.value = true;
  refused.value = false;
  const files = attached.value;
  return Promise.resolve()
    .then(() =>
      props.invoke?.(submit, body.value, files.length ? { files } : {})
    )
    .then(posted => {
      if (!posted) {
        refused.value = true;
        return;
      }
      body.value = "";
      chosen.value = [];
    })
    .catch(() => undefined)
    .finally(() => {
      sending.value = false;
    });
}
</script>

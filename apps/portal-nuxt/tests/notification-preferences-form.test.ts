// -----------------------------------------------------------------------------
/**
 * @module tests/notification-preferences-form
 * @description Gap doc §4 "Notifications" / plan §3 row "Notification
 * preferences": the matrix the no-form phase could only render read-only is
 * the form legacy's `manageNotificationsOptOuts` carried (plan F4, F12). A
 * matrix has no fixed field set, so the schema is built from the topics the
 * brand publishes — one boolean per topic × channel — and the uischema groups
 * them so the form reads as the table it replaces. A MANDATORY topic is the
 * brand's, not the client's: its controls are readonly and the facade leaves
 * them exactly where the brand set them.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { NotificationChannelCodes } from "@upmind-automation/types";
import { boundRefId, rowBinding, stringsIn } from "./support/page-config";
import { assign, cloneDeep, filter, find, flatMap, get, map } from "lodash-es";
import type { ConfigNode } from "./support/page-config";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset } from "~/portal/mock/types";
import { accountPages } from "~/portal/config/account-pages";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction
} from "~/portal/mock/actions";
import * as notificationSchemas from "~/portal/mock/contracts/user-notifications.schemas";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { notificationPreferencesContext } from "~/portal/mock/forms/account-contexts";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { PAGE_KEY } from "~/portal/types";

const NO_CONTEXT: DataRouteContext = {};

const CHANNELS = [
  NotificationChannelCodes.EMAIL,
  NotificationChannelCodes.IN_APP
] as const;

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function ref<T>(data: MockDataset, id: DataRefId): T {
  return resolveDataRefProps({ value: dataRef(id) }, data)?.value as T;
}

function notificationsPage(): unknown {
  return accountPages()[PAGE_KEY.ACCOUNT_NOTIFICATIONS];
}

function formProps(): ConfigNode {
  const row = rowBinding(
    notificationsPage(),
    DATA_REF_ID.NOTIFICATION_PREFERENCES_FORM_MODEL
  );
  const slots = get(row, "slots");
  const props = get(Array.isArray(slots) ? slots[0] : undefined, "props");
  if (typeof props !== "object" || props === null) {
    throw new Error("the notifications page binds no preferences form");
  }
  return props as ConfigNode;
}

function schemaFor(data: MockDataset) {
  return notificationSchemas.useSchema(notificationPreferencesContext(data));
}

function uischemaFor(data: MockDataset) {
  return notificationSchemas.useUischema(notificationPreferencesContext(data));
}

/** Every cell of the matrix, keyed the one way both layers read. */
function cellKeys(data: MockDataset): string[] {
  return flatMap(data.notificationPreferences, preference =>
    map(CHANNELS, channel =>
      notificationSchemas.preferenceKey(preference.topic, channel)
    )
  );
}

function save(model: unknown): string {
  return `${MOCK_ACTION.NOTIFICATION_PREFERENCES_SAVE}:${JSON.stringify(model)}`;
}

describe("the preferences panel is the form now", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("binds the form to its own verb, with the read-only table gone", () => {
    const page = notificationsPage();
    const props = formProps();

    expect(props.submit).toBe(MOCK_ACTION.NOTIFICATION_PREFERENCES_SAVE);
    expect(boundRefId(props, "schema")).toBe(
      DATA_REF_ID.NOTIFICATION_PREFERENCES_FORM_SCHEMA
    );
    expect(boundRefId(props, "uischema")).toBe(
      DATA_REF_ID.NOTIFICATION_PREFERENCES_FORM_UISCHEMA
    );
    expect(props.submitLabel).toBeTruthy();
    expect(stringsIn(page)).toContain(
      DATA_REF_ID.NOTIFICATION_PREFERENCES_FORM_MODEL
    );
    expect(stringsIn(page)).not.toContain(
      DATA_REF_ID.NOTIFICATION_PREFERENCE_ITEMS
    );
    expect(stringsIn(page)).not.toContain(
      DATA_REF_ID.NOTIFICATION_PREFERENCE_HEADINGS
    );
  });

  it("opens on the matrix on file, cell for cell", () => {
    const data = hostgrid();
    const model = ref<Record<string, boolean>>(
      data,
      DATA_REF_ID.NOTIFICATION_PREFERENCES_FORM_MODEL
    );

    expect(model).toEqual(
      notificationSchemas.preferencesDefaults(
        notificationPreferencesContext(data)
      )
    );
    for (const preference of data.notificationPreferences) {
      for (const channel of CHANNELS) {
        expect(
          model[notificationSchemas.preferenceKey(preference.topic, channel)]
        ).toBe(preference.channels[channel]);
      }
    }
  });
});

describe("one control per cell, grouped as the table's rows were", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("asks one boolean per topic and channel, and nothing else", () => {
    const data = hostgrid();
    const properties = get(schemaFor(data), "properties", {});

    expect(Object.keys(properties)).toEqual(cellKeys(data));
    expect(map(Object.values(properties), "type")).toEqual(
      map(cellKeys(data), () => "boolean")
    );
  });

  it("draws a group per topic, holding that topic's own cells", () => {
    const data = hostgrid();
    const groups = uischemaFor(data).elements;

    expect(map(groups, "label")).toEqual(
      map(data.notificationPreferences, "label")
    );
    for (const preference of data.notificationPreferences) {
      const group = find(groups, { label: preference.label });

      expect(get(group, "type")).toBe("Group");
      expect(map(get(group, "elements", []), "scope")).toEqual(
        map(
          CHANNELS,
          channel =>
            `#/properties/${notificationSchemas.preferenceKey(preference.topic, channel)}`
        )
      );
    }
  });

  it("leaves the brand's own topics readable and unanswerable", () => {
    const data = hostgrid();
    const groups = uischemaFor(data).elements;

    expect(
      filter(data.notificationPreferences, { mandatory: true }).length
    ).toBeGreaterThan(0);
    expect(
      filter(data.notificationPreferences, { mandatory: false }).length
    ).toBeGreaterThan(0);
    for (const preference of data.notificationPreferences) {
      const group = find(groups, { label: preference.label });

      expect(map(get(group, "elements", []), "options.readonly")).toEqual(
        map(CHANNELS, () => preference.mandatory)
      );
    }
  });
});

describe("saving the matrix", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("moves the client's own topics and leaves the brand's where they were", () => {
    const data = hostgrid();
    const before = cloneDeep(data.notificationPreferences);
    const flipped: Record<string, boolean> = {};

    for (const preference of before) {
      for (const channel of CHANNELS) {
        flipped[notificationSchemas.preferenceKey(preference.topic, channel)] =
          !preference.channels[channel];
      }
    }

    const result = dispatchMockAction(data, NO_CONTEXT, save(flipped));

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    for (const preference of before) {
      const saved = find(data.notificationPreferences, {
        topic: preference.topic
      });

      expect(saved?.channels).toEqual(
        preference.mandatory
          ? preference.channels
          : assign(
              {},
              ...map(CHANNELS, channel => ({
                [channel]: !preference.channels[channel]
              }))
            )
      );
    }
  });
});

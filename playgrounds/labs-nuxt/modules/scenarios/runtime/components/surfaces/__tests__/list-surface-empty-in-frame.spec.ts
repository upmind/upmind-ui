// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 the empty state lives INSIDE the table (C9, operator: *"it
 * should feel 'in the table' not instead of it"*).
 *
 * ## Job To Be Done
 * `list-surface-states.spec.ts` already proves the two SENTENCES are different —
 * nothing-exists versus nothing-matches, off the module's own `meta.isFiltered`.
 * What is proved here is where they are drawn: the table stays the frame, its
 * declared headers stay on screen, and the message renders as a row inside the
 * body over the table's own column count. So the operator who over-narrows a
 * filter still sees the columns and the controls that let him widen it again.
 *
 * ## What Breaks If These Fail
 * "No results found" replaces the whole table, the headers vanish, and the layout
 * jumps back when a row finally matches — and an empty result looks identical to
 * a broken fetch.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import text from "@upmind-automation/i18n/core/text-en.json";
import { defaultRow } from "../../../../../../tests/support/recorded-emails";
import clientEmails from "../../../../useClientEmails/client-email.scenario";
import { RESOLVED_HANDOFFS } from "../../__tests__/resolved-handoffs";
import { ListSurface } from "../index";
import {
  ACTIONS_COLUMN,
  DECLARED_HEADERS,
  FIRST_DECLARED_COLUMN,
  TABLE_COLUMNS
} from "./table-geometry";
import { map, slice } from "lodash-es";

// -----------------------------------------------------------------------------

const presentation = clientEmails.presentation;

function mountList(rows: unknown[], isFiltered = false) {
  return mount(ListSurface, {
    attachTo: document.body,
    props: {
      snapshot: {
        actions: [],
        context: { data: rows },
        meta: { isEmpty: !rows.length, isFiltered, isLoading: false }
      },
      actions: {},
      presentation,
      handoffs: RESOLVED_HANDOFFS,
      table: {
        read: () => ({
          filter: {},
          sort: [],
          pagination: { page: 1, perPage: 10, total: rows.length }
        }),
        emit: vi.fn()
      }
    }
  });
}

type Wrapper = ReturnType<typeof mountList>;

const headers = (wrapper: Wrapper) =>
  map(wrapper.findAll("thead th"), th => th.text());

/** The header row's declared span — between the marker and the actions anchor. */
const declaredHeaders = (wrapper: Wrapper) =>
  slice(headers(wrapper), FIRST_DECLARED_COLUMN, ACTIONS_COLUMN);

// -----------------------------------------------------------------------------

describe("@AC3 empty — the table keeps the frame and the message sits in it", () => {
  it("keeps the table and its declared headers when nothing matched", () => {
    const wrapper = mountList([], true);

    expect(wrapper.find("table").exists()).toBe(true);
    expect(declaredHeaders(wrapper)).toEqual(DECLARED_HEADERS);
  });

  it("keeps them when the collection itself is empty", () => {
    const wrapper = mountList([], false);

    expect(wrapper.find("table").exists()).toBe(true);
    expect(declaredHeaders(wrapper)).toEqual(DECLARED_HEADERS);
  });

  it("draws the message as a row in the body, spanning the table's own columns", () => {
    const wrapper = mountList([], true);
    const cells = wrapper.findAll("tbody td");

    expect(cells).toHaveLength(1);
    expect(cells[0].attributes("colspan")).toBe(String(TABLE_COLUMNS));
    expect(cells[0].text()).toContain(text.results_not_found);
  });

  it("tells the filtered story inside the frame, not a collection-gone one", () => {
    const body = mountList([], true).find("tbody").text();

    expect(body).toContain(text.adjust_search_filters_msg);
    expect(body).not.toContain(text.collection_empty);
  });

  it("tells the nothing-exists story inside the same frame", () => {
    const body = mountList([], false).find("tbody").text();

    expect(body).toContain(text.collection_empty);
    expect(body).toContain(text.collection_empty_msg);
    expect(body).not.toContain(text.results_not_found);
  });

  it("gives the same headers back once a row matches — no layout jump", () => {
    expect(headers(mountList([], true))).toEqual(
      headers(mountList([defaultRow]))
    );
  });

  it("draws no empty message at all once a row is in hand", () => {
    const body = mountList([defaultRow]).find("tbody").text();

    expect(body).toContain(defaultRow.email);
    expect(body).not.toContain(text.results_not_found);
    expect(body).not.toContain(text.collection_empty);
  });
});

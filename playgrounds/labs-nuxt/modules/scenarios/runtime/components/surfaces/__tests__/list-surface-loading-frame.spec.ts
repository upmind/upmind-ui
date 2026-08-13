// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC3 the table is the FRAME while the rows load (C8, operator:
 * *"loading state is awful… keep the table headers"*).
 *
 * ## Job To Be Done
 * The list used to swap the whole surface out for a state notice, so the headers
 * vanished and the layout jumped when data landed. G4's law: the table always
 * renders, headers included, and each state is drawn inside its body. What is
 * measured here is that the declared headers are on screen DURING the load and
 * are the same headers once the rows arrive — the operator sees what he is
 * waiting for, and nothing moves when it comes.
 *
 * ## What Breaks If These Fail
 * The whole-surface notice comes back: a blank panel where the table was, then a
 * layout jump — and, in the same stroke, the filter controls unmount mid-load so
 * the operator cannot narrow a slow list.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import text from "@upmind-automation/i18n/core/text-en.json";
import { Card, Skeleton } from "@upmind-automation/upmind-ui";
import { defaultRow } from "../../../../../../tests/support/recorded-emails";
import { renderedStrings } from "../../../../../../tests/support/rendered";
import clientEmails from "../../../../useClientEmails/client-email.scenario";
import { RESOLVED_HANDOFFS } from "../../__tests__/resolved-handoffs";
import { ListSurface, ListViewTypes } from "../index";
import {
  ACTIONS_COLUMN,
  DECLARED_HEADERS,
  FIRST_DECLARED_COLUMN
} from "./table-geometry";
import { includes, map, slice } from "lodash-es";

// -----------------------------------------------------------------------------

const presentation = clientEmails.presentation;

const fakeTable = (total: number) => ({
  read: () => ({
    filter: {},
    sort: [],
    pagination: { page: 1, perPage: 10, total }
  }),
  emit: vi.fn()
});

function mountList(isLoading: boolean, rows: unknown[] = []) {
  return mount(ListSurface, {
    attachTo: document.body,
    props: {
      snapshot: {
        actions: [],
        context: { data: rows },
        meta: { isEmpty: !rows.length, isFiltered: false, isLoading }
      },
      actions: {},
      presentation,
      handoffs: RESOLVED_HANDOFFS,
      table: fakeTable(rows.length)
    }
  });
}

type Wrapper = ReturnType<typeof mountList>;

const headers = (wrapper: Wrapper) =>
  map(wrapper.findAll("thead th"), th => th.text());

// -----------------------------------------------------------------------------

describe("@AC3 loading — the headers stay and the table keeps the frame", () => {
  it("renders the real table, headers included, while the rows are still loading", () => {
    const wrapper = mountList(true);

    expect(wrapper.find("table").exists()).toBe(true);
    expect(
      slice(headers(wrapper), FIRST_DECLARED_COLUMN, ACTIONS_COLUMN)
    ).toEqual(DECLARED_HEADERS);
  });

  it("draws the placeholder INSIDE the table body, never in place of the table", () => {
    const wrapper = mountList(true);

    expect(wrapper.find("tbody").findAllComponents(Skeleton).length).toBe(
      wrapper.findAllComponents(Skeleton).length
    );
    expect(wrapper.findAllComponents(Skeleton).length).toBeGreaterThan(0);
  });

  it("shows no whole-surface loading notice — the frame IS the loading state", () => {
    const strings = renderedStrings(mountList(true));

    for (const sentence of [text.loading, text.collection_empty]) {
      expect(includes(strings, sentence)).toBe(false);
    }
  });

  it("keeps the SAME headers once the rows land, so the layout never jumps", () => {
    const loading = headers(mountList(true));
    const ready = headers(mountList(false, [defaultRow]));

    expect(loading).toEqual(ready);
  });

  it("draws no skeleton once the rows are in hand", () => {
    const wrapper = mountList(false, [defaultRow]);

    expect(wrapper.findAllComponents(Skeleton)).toHaveLength(0);
    expect(wrapper.find("tbody").text()).toContain(defaultRow.email);
  });

  it("keeps the CARD view its own frame while loading — placeholder cards, not a notice", async () => {
    const wrapper = mountList(true);

    await wrapper
      .find(`[data-test-value="${ListViewTypes.CARD}"]`)
      .trigger("click");

    expect(wrapper.findAllComponents(Card).length).toBeGreaterThan(0);
    expect(wrapper.findAllComponents(Skeleton).length).toBeGreaterThan(0);
    expect(includes(renderedStrings(wrapper), text.collection_empty)).toBe(
      false
    );
  });
});

// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/__tests__/column-picker.spec
 * @description `R6-25` — the display row's column picker: every declared column
 * is offerable, the ticked set is what the table draws, picking one asks for a
 * new set rather than mutating anything itself, and a table can never be left
 * with no columns at all.
 *
 * The control is a composed ui `DropdownMenu` with checkable items, so the menu
 * is read where it is portalled rather than inside the wrapper — which is also
 * what proves it is the real portal panel and not a hand-rolled list (`R6-9`).
 *
 * ## What Breaks If These Fail
 * The picker becomes a one-way door (a hidden column leaves the menu), or the
 * user empties the table into a header row with nothing under it.
 *
 * Negative controls: `column-picker.last-column.must-fail.patch`.
 */

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { ColumnPicker } from "../index";
import { first, map } from "lodash-es";
import type { ColumnOption } from "../ColumnPicker.types";

// -----------------------------------------------------------------------------

const TRIGGER = '[data-test-key="columns"]';
const ITEM = '[data-test-key="column"]';

const DECLARED: ColumnOption[] = [
  { value: "meta", label: "Default", isVisible: true },
  { value: "email", label: "Email address", isVisible: true },
  { value: "status", label: "Status", isVisible: false },
  { value: "bouncedAt", label: "Date bounced", isVisible: true }
];

async function open(columns = DECLARED, disabled = false) {
  const wrapper = mount(ColumnPicker, {
    attachTo: document.body,
    props: { columns, disabled }
  });

  await wrapper.find(TRIGGER).trigger("click");
  await new Promise(resolve => setTimeout(resolve, 20));

  return wrapper;
}

const items = () => [...document.querySelectorAll<HTMLElement>(ITEM)];

const itemFor = (value: string) =>
  document.querySelector<HTMLElement>(`${ITEM}[data-test-value="${value}"]`);

afterEach(() => {
  document.body.innerHTML = "";
});

// -----------------------------------------------------------------------------

describe("R6-25 the picker offers every DECLARED column, drawn or not", () => {
  it("lists one entry per declared column, in declaration order", async () => {
    await open();

    expect(map(items(), item => item.dataset.testValue)).toEqual(
      map(DECLARED, "value")
    );
  });

  it("ticks exactly the columns the table is drawing", async () => {
    await open();

    expect(map(items(), item => item.getAttribute("aria-checked"))).toEqual(
      map(DECLARED, column => String(column.isVisible))
    );
  });

  it("keeps a hidden column offerable, so nothing is a one-way door", async () => {
    await open();

    expect(itemFor("status")).not.toBeNull();
    expect(itemFor("status")?.getAttribute("aria-checked")).toBe("false");
  });
});

describe("R6-25 picking asks for a new set — the picker owns nothing", () => {
  it("asks for the column it was told to add, keeping declaration order", async () => {
    const wrapper = await open();

    itemFor("status")?.click();
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(first(wrapper.emitted("update:columns"))).toEqual([
      ["meta", "email", "status", "bouncedAt"]
    ]);
  });

  it("asks for the column it was told to drop, leaving the rest alone", async () => {
    const wrapper = await open();

    itemFor("email")?.click();
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(first(wrapper.emitted("update:columns"))).toEqual([
      ["meta", "bouncedAt"]
    ]);
  });
});

describe("R6-25 a table always keeps at least one column", () => {
  const ONE_LEFT: ColumnOption[] = [
    { value: "meta", label: "Default", isVisible: false },
    { value: "email", label: "Email address", isVisible: true }
  ];

  it("refuses the last drawn column rather than emptying the table", async () => {
    const wrapper = await open(ONE_LEFT);

    expect(itemFor("email")?.getAttribute("aria-disabled")).toBe("true");

    itemFor("email")?.click();
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(wrapper.emitted("update:columns")).toBeUndefined();
  });

  it("still offers the hidden ones — the floor is on removal alone", async () => {
    const wrapper = await open(ONE_LEFT);

    expect(itemFor("meta")?.getAttribute("aria-disabled")).not.toBe("true");

    itemFor("meta")?.click();
    await new Promise(resolve => setTimeout(resolve, 20));

    expect(first(wrapper.emitted("update:columns"))).toEqual([
      ["meta", "email"]
    ]);
  });
});

describe("R6-23 a replay drives the table, so the picker is locked", () => {
  it("refuses to open while a track is armed", async () => {
    await open(DECLARED, true);

    expect(items()).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
/**
 * @module tests/list-controls-module
 * @description The `list-controls` module's contract: it renders what its `state`
 * gives it and decides nothing. A typed word travels as ONE debounced search;
 * Enter sends it now; emptying the field IS the clear. The sort select emits
 * the selector-authored value verbatim, and a state carrying neither concern
 * renders no chrome at all. `concern` narrows one instance to a single half,
 * which is how the control band seats the field and the order apart while both
 * read the same state.
 *
 * Paired blind with tests/list-controls-module.must-fail.patch.
 */

import { Select } from "@upmind/ui";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ListControlsConcern,
  ListControlsState
} from "~/portal/modules/list-controls/types";
import ListControlsModule from "~/portal/modules/list-controls/ListControls.vue";
import { LIST_CONTROLS_CONCERN } from "~/portal/modules/list-controls/types";

const ROOT = '[data-test-key="portal-list-controls"]';
const SEARCH = '[data-test-key="portal-list-controls-search"]';
const SORT = '[data-test-key="portal-list-controls-sort"]';

const FULL_STATE: ListControlsState = {
  searchValue: "",
  searchAction: "collection-search:invoices",
  sortValue: "default",
  sortAction: "collection-sort:invoices",
  sortOptions: [
    { value: "default", label: "Default" },
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" }
  ]
};

function mountControls(
  state?: ListControlsState,
  concern?: ListControlsConcern
) {
  return mount(ListControlsModule, {
    props: {
      state,
      concern,
      searchPlaceholder: "Search by number",
      searchLabel: "Search invoices",
      sortLabel: "Sort invoices"
    }
  });
}

describe("list-controls module — renders its state, decides nothing", () => {
  it("renders the field and the select from one state object", () => {
    const wrapper = mountControls(FULL_STATE);

    expect(wrapper.find(ROOT).exists()).toBe(true);
    expect(wrapper.find(SEARCH).attributes("aria-label")).toBe(
      "Search invoices"
    );
    expect(wrapper.find(SEARCH).attributes("placeholder")).toBe(
      "Search by number"
    );
    expect(wrapper.find(SORT).attributes("aria-label")).toBe("Sort invoices");
  });

  it("renders nothing at all without a state", () => {
    expect(mountControls().find(ROOT).exists()).toBe(false);
  });

  it("renders nothing when the state carries neither concern", () => {
    expect(mountControls({}).find(ROOT).exists()).toBe(false);
  });

  it("drops the select when the state carries no sort fields", () => {
    const wrapper = mountControls({
      searchValue: "",
      searchAction: "collection-search:tickets"
    });

    expect(wrapper.find(SEARCH).exists()).toBe(true);
    expect(wrapper.find(SORT).exists()).toBe(false);
  });

  it("renders ONE half per concern, both against the same state", () => {
    const search = mountControls(FULL_STATE, LIST_CONTROLS_CONCERN.SEARCH);
    expect(search.find(SEARCH).exists()).toBe(true);
    expect(search.find(SORT).exists()).toBe(false);

    const sort = mountControls(FULL_STATE, LIST_CONTROLS_CONCERN.SORT);
    expect(sort.find(SORT).exists()).toBe(true);
    expect(sort.find(SEARCH).exists()).toBe(false);
  });

  it("a concern whose state fields are absent still renders nothing at all", () => {
    const searchOnlyState: ListControlsState = {
      searchValue: "",
      searchAction: "collection-search:tickets"
    };

    // The band mounts both halves against one ref; the sort half of a
    // sort-less collection must leave no empty chrome behind.
    const sort = mountControls(searchOnlyState, LIST_CONTROLS_CONCERN.SORT);
    expect(sort.find(ROOT).exists()).toBe(false);

    const search = mountControls(searchOnlyState, LIST_CONTROLS_CONCERN.SEARCH);
    expect(search.find(SEARCH).exists()).toBe(true);
  });

  it("still emits its own concern's grammar when narrowed", async () => {
    const wrapper = mountControls(FULL_STATE, LIST_CONTROLS_CONCERN.SORT);

    await wrapper.findComponent(Select).vm.$emit("update:modelValue", "oldest");

    expect(wrapper.emitted("select")).toEqual([
      ["collection-sort:invoices:oldest"]
    ]);
  });

  it("opens on the applied query and re-seeds when a tab hands it another", async () => {
    const wrapper = mountControls({
      searchValue: "acme",
      searchAction: "collection-search:invoices"
    });

    expect(wrapper.find<HTMLInputElement>(SEARCH).element.value).toBe("acme");

    await wrapper.setProps({
      state: {
        searchValue: "",
        searchAction: "collection-search:invoices"
      }
    });
    expect(wrapper.find<HTMLInputElement>(SEARCH).element.value).toBe("");
  });
});

describe("list-controls module — the search emit grammar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends ONE search 300ms after the last keystroke", async () => {
    const wrapper = mountControls(FULL_STATE);
    const field = wrapper.find(SEARCH);

    await field.setValue("a");
    await field.setValue("ac");
    await field.setValue("acme");

    vi.advanceTimersByTime(299);
    expect(wrapper.emitted("select")).toBeUndefined();

    vi.advanceTimersByTime(1);
    expect(wrapper.emitted("select")).toEqual([
      ["collection-search:invoices:acme"]
    ]);
  });

  it("Enter sends what is typed now and drops the pending run", async () => {
    const wrapper = mountControls(FULL_STATE);
    const field = wrapper.find(SEARCH);

    await field.setValue("acme");
    await field.trigger("keydown.enter");

    expect(wrapper.emitted("select")).toEqual([
      ["collection-search:invoices:acme"]
    ]);

    vi.advanceTimersByTime(300);
    expect(wrapper.emitted("select")).toHaveLength(1);
  });

  it("emptying the field IS the clear — an empty payload, no clear button", async () => {
    const wrapper = mountControls({
      searchValue: "acme",
      searchAction: "collection-search:invoices"
    });

    await wrapper.find(SEARCH).setValue("");
    vi.advanceTimersByTime(300);

    expect(wrapper.emitted("select")).toEqual([
      ["collection-search:invoices:"]
    ]);
  });

  it("carries text with colons through verbatim — the payload is the TAIL", async () => {
    const wrapper = mountControls(FULL_STATE);

    await wrapper.find(SEARCH).setValue("a:b:c");
    vi.advanceTimersByTime(300);

    expect(wrapper.emitted("select")).toEqual([
      ["collection-search:invoices:a:b:c"]
    ]);
  });
});

describe("list-controls module — the sort emit grammar", () => {
  it("emits the picked option's value and never reorders itself", async () => {
    const wrapper = mountControls(FULL_STATE);

    // reka drives its overlay through a Portal that jsdom will not open; the
    // module's contract is what it does with the Select's own emit.
    await wrapper.findComponent(Select).vm.$emit("update:modelValue", "newest");

    expect(wrapper.emitted("select")).toEqual([
      ["collection-sort:invoices:newest"]
    ]);
    // Still showing the state's value — the collection answers, not the module.
    expect(wrapper.findComponent(Select).props("modelValue")).toBe("default");
  });

  it("renders the selector's options verbatim, default entry included", () => {
    const wrapper = mountControls(FULL_STATE);

    expect(wrapper.findComponent(Select).props("items")).toEqual([
      { value: "default", label: "Default" },
      { value: "newest", label: "Newest first" },
      { value: "oldest", label: "Oldest first" }
    ]);
  });
});

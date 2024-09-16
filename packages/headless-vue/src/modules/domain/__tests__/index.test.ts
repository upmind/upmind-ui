import { describe, it, expect, vi, beforeEach } from "vitest";
import { useActor } from "@xstate/vue";
import { useDomain as useUpmindDomain } from "@upmind/headless";
import { useDomain } from "../index";

// Mock useActor from @xstate/vue
vi.mock("@xstate/vue", () => ({
  useActor: vi.fn(),
}));

// Mock useDomain from @upmind/headless
vi.mock("@upmind/headless", () => ({
  useDomain: vi.fn(() => ({
    domain: {
      service: vi.fn(),
    },
  })),
}));

describe("useDomain", () => {
  let mockState;
  let send;

  beforeEach(() => {
    mockState = {
      value: {
        value: "idle",
        context: {
          values: ["testing context value"],
          choices: [],
          type: "",
          available: [],
          error: null,
        },
        matches: vi.fn(state => state === "loading"),
      },
    };
    send = vi.fn();

    useActor.mockReturnValue({ state: mockState, send });

    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("should return the correct initial state", () => {
    const { state } = useDomain();

    expect(useUpmindDomain).toHaveBeenCalled();
    expect(useActor).toHaveBeenCalled();
    expect(state.value).toBe(mockState.value.value);
  });

  it("should send CHOOSE event", () => {
    const { choose } = useDomain();
    choose("example");
    expect(send).toHaveBeenCalledWith({
      type: "CHOOSE",
      data: "example",
    });
  });

  it("should send SEARCH event", () => {
    const { search } = useDomain();
    search("example");
    expect(send).toHaveBeenCalledWith({
      type: "SEARCH",
      data: {
        domain: "example",
      },
    });
  });

  // it('should toggle ADD and REMOVE event', () => {
  //   let mockData = 'not an existing context value';
  //   const { toggle } = useDomain();

  //   toggle(mockData);
  //   expect(send).toHaveBeenCalledWith({
  //     type: 'ADD',
  //     data: mockData,
  //   });

  //   mockData = 'testing context value';
  //   toggle(mockData);
  //   expect(send).toHaveBeenCalledWith({
  //     type: 'REMOVE',
  //     data: mockData,
  //   });
  // });

  it("should send ADD event", () => {
    const { add } = useDomain();
    add("example");
    expect(send).toHaveBeenCalledWith({
      type: "ADD",
      data: "example",
    });
  });

  it("should send REMOVE event", () => {
    const { remove } = useDomain();
    remove("example");
    expect(send).toHaveBeenCalledWith({
      type: "REMOVE",
      data: "example",
    });
  });

  it("should send SELECT event", () => {
    const { setPrimaryDomain } = useDomain();
    setPrimaryDomain("example");
    expect(send).toHaveBeenCalledWith({
      type: "SELECT",
      data: "example",
    });
  });

  it("should return the correct meta state", () => {
    const { meta } = useDomain();
    expect(meta.value.isLoading).toBe(true);
    expect(meta.value.isProcessing).toBe(false);
    expect(meta.value.isSyncing).toBe(false);
    expect(meta.value.isSearching).toBe(false);
    expect(meta.value.hasErrors).toBe(false);
    expect(meta.value.showChoices).toBe(false);
    expect(meta.value.showRegister).toBe(false);
    expect(meta.value.showTransfer).toBe(false);
    expect(meta.value.showExisting).toBe(false);
    expect(meta.value.showBasket).toBe(false);
    expect(meta.value.showContinue).toBe(false);
    expect(meta.value.hasValues).toBe(true);
    expect(meta.value.hasPrimary).toBe(false);
    expect(meta.value.hasAdditional).toBe(false);
    expect(meta.value.hasMore).toBe(false);
  });
});

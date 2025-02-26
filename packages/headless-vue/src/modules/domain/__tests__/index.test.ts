import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useActor } from "@xstate/vue";
import { useDomain as useUpmindDomain } from "@upmind-automation/headless";
import { useDomain } from "../index";

// Mock useActor from @xstate/vue
vi.mock("@xstate/vue", () => ({
  useActor: vi.fn(),
}));

// Mock useDomain from @upmind-automation/headless
vi.mock("@upmind-automation/headless", () => ({
  useDomain: vi.fn(() => ({
    domain: {
      service: vi.fn(),
    },
  })),
}));

describe("useDomain", () => {
  let mockState: any;
  let sendMock: any;

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
    sendMock = vi.fn();

    useActor.mockReturnValue({ state: mockState, send: sendMock });

    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
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
    expect(sendMock).toHaveBeenCalledWith({
      type: "CHOOSE",
      data: "example",
    });
  });

  describe("send SEARCH event", () => {
    it("should call search after debounce", () => {
      const { search } = useDomain();
      vi.useFakeTimers();

      search("example");

      expect(sendMock).not.toHaveBeenCalled();
      vi.advanceTimersByTime(500);
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock).toHaveBeenCalledWith({
        type: "SEARCH",
        data: "example",
      });

      vi.useRealTimers();
    });

    it("should reset debounce if called again", () => {
      const { search } = useDomain();
      vi.useFakeTimers();

      search("example");
      vi.advanceTimersByTime(300);
      search("example2");
      vi.advanceTimersByTime(500);

      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock).toHaveBeenCalledWith({
        type: "SEARCH",
        data: "example2",
      });

      vi.useRealTimers();
    });
  });

  // it('should toggle ADD and REMOVE event', () => {
  //   let mockData = 'not an existing context value';
  //   const { toggle } = useDomain();

  //   toggle(mockData);
  //   expect(sendMock).toHaveBeenCalledWith({
  //     type: 'ADD',
  //     data: mockData,
  //   });

  //   mockData = 'testing context value';
  //   toggle(mockData);
  //   expect(sendMock).toHaveBeenCalledWith({
  //     type: 'REMOVE',
  //     data: mockData,
  //   });
  // });

  it("should send ADD event", () => {
    const { add } = useDomain();
    add("example");
    expect(sendMock).toHaveBeenCalledWith({
      type: "ADD",
      data: "example",
    });
  });

  it("should send REMOVE event", () => {
    const { remove } = useDomain();
    remove("example");
    expect(sendMock).toHaveBeenCalledWith({
      type: "REMOVE",
      data: "example",
    });
  });

  it("should send SELECT event", () => {
    const { setPrimaryDomain } = useDomain();
    setPrimaryDomain("example");
    expect(sendMock).toHaveBeenCalledWith({
      type: "SELECT",
      data: "example",
    });
  });

  it("should return the correct meta state", () => {
    const { meta } = useDomain();
    // TODO: Complete with missing default meta properties
    expect(meta.value.isLoading).toBe(true);
    expect(meta.value.isSearching).toBe(false);
    expect(meta.value.hasErrors).toBe(false);
    expect(meta.value.showChoices).toBe(true);
    expect(meta.value.showExisting).toBe(false);
    expect(meta.value.showBasket).toBe(false);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { useActor } from "@xstate/vue";
import { useBrand as useUpmindBrand } from "@upmind-automation/headless";
import { useBrand } from "../index";

// Mock useActor from @xstate/vue
vi.mock("@xstate/vue", () => ({
  useActor: vi.fn(),
}));

// Mock useBrand from @upmind-automation/headless
vi.mock("@upmind-automation/headless", () => ({
  useBrand: vi.fn(() => ({
    service: vi.fn(),
    isReady: true,
  })),
}));

describe("useBrand", () => {
  let mockState: any;
  let send: any;

  beforeEach(() => {
    mockState = {
      value: {
        matches: vi.fn(state => state === "processing"),
      },
    };

    // @ts-ignore
    useActor.mockReturnValue({ state: mockState, send });

    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("should return the correct initial state", () => {
    const { state, isReady } = useBrand();

    expect(useUpmindBrand).toHaveBeenCalled();
    expect(useActor).toHaveBeenCalled();
    expect(state.value).toBe(mockState.value.value);
    expect(isReady).toBeTruthy();
  });

  it("should return the correct meta state", () => {
    const { meta } = useBrand();

    expect(meta.value.isLoading).toBe(true);
    expect(meta.value.isReady).toBe(false);
    expect(meta.value.isComplete).toBe(false);
    expect(meta.value.hasErrors).toBe(false);
  });

  it("should change meta state accordingly", () => {
    mockState.value.matches.mockReturnValue(
      (state: any) => state === "complete"
    );
    const { meta } = useBrand();

    expect(meta.value.isComplete).toBeTruthy();
  });
});

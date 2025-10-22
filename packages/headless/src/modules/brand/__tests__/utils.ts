import { vi } from "vitest";

export type QueryMock<T = any> = {
  data: { value: T | undefined };
  isLoading: { value: boolean };
  isFetched: { value: boolean };
  isError: { value: boolean };
  error: { value: any };
  refetch: ReturnType<typeof vi.fn>;
  promise?: { value: Promise<T> };
};

export function makeQuery<T>(
  data: T,
  opts?: Partial<QueryMock<T>>
): QueryMock<T> {
  return {
    data: { value: data },
    isLoading: { value: false },
    isFetched: { value: true },
    isError: { value: false },
    error: { value: null },
    refetch: vi.fn(),
    promise: { value: Promise.resolve(data) },
    ...opts
  } as QueryMock<T>;
}

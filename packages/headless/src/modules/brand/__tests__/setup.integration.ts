import { join } from "node:path";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";

export const recordingsDir = join(import.meta.dirname, "fixtures");

export const server = startReplayServer({ recordingsDir });

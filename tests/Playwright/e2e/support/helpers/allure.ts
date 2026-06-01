import { test, expect } from "@playwright/test";
import * as allure from "allure-js-commons";

// Call these in a test/before block to set the severity metadata for a test for allure

export async function low() {
  await allure.severity("low");
}
export async function normal() {
  await allure.severity("normal");
}
export async function high() {
  await allure.severity("high");
}
export async function blocker() {
  await allure.severity("blocker");
}

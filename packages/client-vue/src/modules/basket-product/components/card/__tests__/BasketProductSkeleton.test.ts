import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import BasketProductSkeleton from "../BasketProductSkeleton.vue";

// The loaded BasketProduct draws its own Card only when card=true; a skeleton
// that always drew one nested a card inside the section card on every refresh.
describe("BasketProductSkeleton", () => {
  it("draws its own card by default", () => {
    const wrapper = mount(BasketProductSkeleton);

    expect(wrapper.findAll('[data-slot="card"]').length).toBe(1);
  });

  it("stays flat inside a parent card when card=false", () => {
    const wrapper = mount(BasketProductSkeleton, { props: { card: false } });

    expect(wrapper.findAll('[data-slot="card"]').length).toBe(0);
  });
});

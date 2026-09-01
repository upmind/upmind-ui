# basket-billing Changelog

All notable changes to the basket-billing module.

## [Unreleased]

### Verified

- Integration coverage now drives the billing seam through a real, claimed basket rather than a scaffolded host: a client loading their own claimed basket brings billing to an available state; a client loading a basket that belongs to someone else is denied and billing never becomes available; an unclaimed (guest) basket loads and reaches a normal shopping state but never brings billing up.
- The billing commit and the brand-config bootstrap it depends on are now proven to fail closed on a server error — the billing seam settles into a handled failure rather than hanging.
- No production behaviour changed; this hardens the proof behind existing behaviour.

---

## Migration Guide

### From v1.x to v2.x

> _No migrations yet — this section will be populated when breaking changes occur._

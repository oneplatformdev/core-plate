---
name: api-design-principles
description: API design skill for request and response contracts, versioning discipline, validation, idempotency, and error-shape consistency.
---

# API Design Principles

## Principles

- keep contracts explicit and predictable
- validate at boundaries
- use consistent error shapes
- design for idempotency where retries are possible
- separate transport shape from persistence shape

## Apply When

- creating or changing REST endpoints
- designing webhook handlers
- shaping DTOs or public SDK-facing contracts

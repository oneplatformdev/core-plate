# Agent Workflow Orchestration

## General Rules

- Enter planning mode for tasks with multiple steps, architectural tradeoffs, or cross-cutting changes.
- Detect the repository preset before assigning implementation work.
- Keep research, implementation, testing, and review responsibilities separate.
- Verify behavior before marking work complete.
- Prefer parallel verification when checks are independent.

## Default Pipeline

### Standard Feature

1. `ba` — clarify requirements and acceptance criteria
2. `developer` or `frontend` — implement
3. `security-scanner` — review auth, input handling, and exposure risks
4. `tester` — add or update tests
5. `qa` — verify browser flows when UI is affected
6. `docs-writer` — summarize changes and operational notes

### Bug Fix

1. `debugger` — identify root cause
2. `developer` or `frontend` — implement the fix
3. `tester` — add regression coverage

### Infrastructure / Delivery

1. `devops` — runtime, container, hosting, environment
2. `ci-cd-engineer` — CI workflow or release automation

## Agent Routing

- Use `developer` for full-stack Next work, Nest backend work, shared Node services, and API handlers.
- Use `frontend` for React components, state management, browser behavior, styling, and client performance.
- Use `integration-architect` for OAuth, webhooks, queues, SDK integrations, and cross-service contracts.
- Use `reviewer` for read-only quality checks and audits.

## Verification Before Completion

At least one of the following must run when relevant:

- lint
- unit or integration tests
- typecheck
- build
- framework check
- targeted manual verification steps

If a check cannot be run, state the reason explicitly.

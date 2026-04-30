# Git Operations

- Never commit, push, or open a PR unless the user asks.
- Keep unrelated user changes intact.
- Prefer small, reviewable diffs.
- Do not rewrite history without explicit instruction.
- Summaries should describe behavior changes, not just file changes.

## Branch and PR Guidance

- Keep branch names descriptive.
- PR summaries should state:
  - what changed
  - why it changed
  - how it was verified
  - notable risks or follow-up work

## Review Safety

- When asked for review, remain read-only unless the user then asks for fixes.
- Prioritize correctness, regressions, security, and missing tests before style feedback.

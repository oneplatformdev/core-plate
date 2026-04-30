---
name: nextjs-app-router
description: Next.js App Router skill for server components, client components, route handlers, server actions, caching, metadata, and runtime boundaries.
---

# Next.js App Router

## Principles

- default to server components
- add `use client` only when browser APIs or interaction require it
- keep secrets and privileged logic on the server
- make caching and revalidation choices explicit

## Apply When

- creating pages, layouts, route handlers, and server actions
- separating server and client responsibilities
- debugging hydration, navigation, or cache invalidation issues
- implementing auth, middleware, or edge/runtime-specific behavior

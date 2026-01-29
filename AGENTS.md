# AGENTS.md

## Dev Environment

```bash
nvm use && corepack enable && pnpm install && pnpm build
```

## Testing

```bash
pnpm test --run                    # All tests
pnpm test:<package> --run          # Package: types, core, client, react, cli
pnpm vitest --run --project <project> <file> -t "<test-name>"  # Specific test
```

## SDK Architecture

| Package | Purpose |
|---------|---------|
| `@aave/graphql` | GraphQL queries, fragments, types |
| `@aave/client` | TypeScript client actions (imperative API) |
| `@aave/react` | React hooks (declarative API) |
| `@aave/types` | Shared TypeScript types |
| `@aave/core` | Core SDK functionality |
| `@aave/cli` | Command-line tools |

**Key concepts:**
- **Actions** (`packages/client/src/actions/`): Imperative functions for GraphQL queries
- **Hooks** (`packages/react/src/`): React hooks wrapping actions with state management
- **Imperative read hooks** (`use[X]Action`): Use `cache-first` policy, except `usePreviewAction`, `useExchangeRateAction`, and swap quote hooks which use `network-only`

When updating GraphQL queries, update corresponding actions. Only update hooks if explicitly requested.

## Schema Updates

Use Claude `/schema-update` skill. See `.claude/skills/schema-update/SKILL.md`.

## Commits & Changesets

**Commits:** conventional format (`fix:`, `feat:`, `chore:`), no `Co-Authored-By` trailers.

**Changesets:** Create manually in `.changeset/` (e.g., `adjective-noun-verb.md`):
```
---
"@aave/graphql": patch
"@aave/client": patch
"@aave/react": patch
---

**fix:** description using `backticks` for code references
```

- `patch` = bug fix, `minor` = feature, `major` = breaking change
- Always include `@aave/client` and `@aave/react` when changing their dependencies (`@aave/graphql`, `@aave/types`, `@aave/core`)
- One-line description only, bold type prefix (`**fix:**`)

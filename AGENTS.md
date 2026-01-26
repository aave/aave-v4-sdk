# AGENTS.md

## Dev environment tips

- Use `nvm use` to use the correct Node.js version.
- Use `corepack enable` to install the correct version of pnpm.
- Use `pnpm install` to install the dependencies.
- Use `pnpm build` to build the project.

## Testing instructions

**Run all tests across the monorepo:**
```bash
pnpm test --run
```

**Run tests for a specific package** (pattern: `pnpm test:<package-name> --run`):
```bash
pnpm test:types --run      # @aave/types
pnpm test:core --run       # @aave/core
pnpm test:client --run     # @aave/client
pnpm test:react --run      # @aave/react
pnpm test:cli --run        # @aave/cli
```

**Run a specific test file:**
```bash
pnpm vitest --run --project <project-name> <path-to-test-file>
```

**Focus on a single test by name:**
```bash
pnpm vitest --run --project <project-name> <path-to-test-file> -t "<test-name>"
```

**Examples:**
```bash
# Run all React tests
pnpm test:react --run

# Run a specific test file in the client package
pnpm vitest --run --project client packages/client/src/viem.test.ts

# Run a specific test by name
pnpm vitest --run --project react packages/react/src/swap.test.ts -t "should handle swap quote"
```

## SDK Architecture & Terminology

The SDK is organized into packages:

- **`@aave/graphql`**: GraphQL queries, fragments, and type definitions
- **`@aave/client`**: TypeScript client actions (imperative API)
- **`@aave/react`**: React hooks (declarative API)
- **`@aave/types`**: Shared TypeScript types and utilities
- **`@aave/core`**: Core SDK functionality and shared code
- **`@aave/cli`**: Command-line tools

**Terminology:**
- **Actions** (`packages/client/src/actions/`): Imperative functions that execute GraphQL queries. Use when asked to update "actions" or "client actions".
- **Hooks** (`packages/react/src/`): React hooks that wrap actions with reactive state management. Only update when explicitly requested.
- **Queries/Documents** (`packages/graphql/src/`): GraphQL query definitions and fragments.

When updating GraphQL queries, update corresponding actions. Only update hooks if explicitly requested.

## Schema updates

Use the `/schema-update` skill to update the GraphQL schema. See `.claude/skills/schema-update/SKILL.md` for detailed instructions.

## Commit guidelines

- Use conventional commits format: `type: description` (e.g., `fix:`, `feat:`, `chore:`, `docs:`)
- Do NOT include `Co-Authored-By` trailers
- Keep commit messages concise and descriptive

## Changesets

When creating changesets, create the file manually in `.changeset/` directory since interactive prompts don't work in this environment:

1. Create a new file in `.changeset/` with a random name like `adjective-noun-verb.md`
2. Use this format:
```
---
"@aave/graphql": patch
"@aave/client": patch
"@aave/react": patch
---

**fix:** description of the change
```

**Important notes:**
- Bump types: `patch` for bug fixes, `minor` for new features, `major` for breaking changes
- **Always include primary packages** (`@aave/client` and `@aave/react`) when creating changesets for sub-dependencies like `@aave/graphql`, `@aave/types`, or `@aave/core`, since they depend on these packages
- For changes only to `@aave/cli`, you can omit the primary packages
- **Changelog description format:** Follow the same conventional commits format as commit messages (e.g., `fix:`, `feat:`, `chore:`, `docs:`), but use **bold** formatting (e.g., `**fix:**`, `**feat:**`, `**chore:**`)
- **Keep it concise:** One line description only - just the essential change summary
- **Code references:** Use backticks for type names, field names, function names, and other code identifiers (e.g., `` `QuoteAccuracy` ``, `` `spotBuy` ``, `` `SwapQuote` ``)

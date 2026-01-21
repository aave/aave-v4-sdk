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

When updating the GraphQL schema in the SDK:

1. **Download schema:**
   - Use `pnpm gql:download:local` from `packages/graphql` to download from local server
   - Use `pnpm gql:download:staging` from `packages/graphql` to download from staging server
   - Run `pnpm gql:generate:introspection` to generate GraphQL documents from schema

2. **Update documents:**
   - Cross reference `packages/graphql/schema.graphql` with GQL documents
   - Add missing fields and introduce new fragments if necessary
   - DO NOT add documents for new queries or mutations unless explicitly asked

3. **Check for new or updated enums:**
   - Search for new `enum` definitions in `packages/graphql/schema.graphql`
   - For each new or updated enum:
     - Add the enum definition to `packages/graphql/src/enums.ts` with JSDoc comments
     - Import the enum type in `packages/graphql/src/graphql.ts`
     - Add the scalar binding in the `graphql` configuration object (alphabetically ordered)
     - **Note:** Do NOT create a separate type export using `ReturnType<typeof graphql.scalar<'EnumName'>>` for enums - the enum definition itself serves as both the runtime value and the type
   - Example enum definition in `enums.ts`:
     ```typescript
     /**
      * Quote accuracy level for swap quotes.
      */
     export enum QuoteAccuracy {
       /**
        * Fast price quality - faster response, potentially less accurate price
        */
       FAST = 'FAST',
       /**
        * Verified price quality - more accurate price (default)
        */
       ACCURATE = 'ACCURATE',
     }
     ```
   - Example scalar binding in `graphql.ts`:
     ```typescript
     // Add to imports
     import type { ..., QuoteAccuracy } from './enums';

     // Add to scalars config (alphabetically)
     scalars: {
       ...
       QuoteAccuracy: QuoteAccuracy,
       ...
     }
     ```

4. **Export input types:**
   - **Common types** (used across multiple queries): export from `packages/graphql/src/inputs.ts`
   - **Query-specific types**: colocate with their corresponding query files (permits.ts, transactions.ts, swaps.ts, user.ts, reserve.ts, hub.ts, misc.ts)
   - Use pattern: `export type InputName = ReturnType<typeof graphql.scalar<'InputName'>>;`
   - Exclude fork-related input types unless explicitly needed
   - Ensure for all usage of `ReturnType<typeof graphql.scalar<'<input-name>'>>` there is a corresponding input type in `packages/graphql/src/graphql.ts`

5. **Validate:**
   - Use `pnpm check` from `packages/graphql` to check integrity of GraphQL documents

## Commit guidelines

- Use conventional commits format: `type: description` (e.g., `fix:`, `feat:`, `chore:`, `docs:`)
- Do NOT include `Co-Authored-By` trailers
- Keep commit messages concise and descriptive

## Manually Publishing

- Checkout latest `main` branch
- Run `pnpm install` to ensure dependencies are up to date
- Run `pnpm build` to build all packages
- Run `pnpm changeset version` to bump versions based on changesets
- When in pre-release mode, verify that none of the changes is a major bump
- Add and commit with `chore: bumps up versions`
- Ensure `pnpm` is authenticated, if not prompt the user
- Run `pnpm changeset publish`
- Run `git push --follow-tags`
- Include the CLI `README.md` file and include commit it with `chore: update CLI README`
- DONE!

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

# AGENTS.md
 
## Dev environment tips

- Use `nvm use` to use the correct Node.js version.
- Use `corepack enable` to install the correct version of pnpm.
- Use `pnpm install` to install the dependencies.
- Use `pnpm build` to build the project.

## Testing instructions

- Use `pnpm test:react --run` to run `@aave/react` tests.
- Use `pnpm vitest --run --project <project-name> <path-to-test-file> -t "<test-name>"` to focus on one single test.

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

3. **Export input types:**
   - **Common types** (used across multiple queries): export from `packages/graphql/src/inputs.ts`
   - **Query-specific types**: colocate with their corresponding query files (permits.ts, transactions.ts, swaps.ts, user.ts, reserve.ts, hub.ts, misc.ts)
   - Use pattern: `export type InputName = ReturnType<typeof graphql.scalar<'InputName'>>;`
   - Exclude fork-related input types unless explicitly needed
   - Ensure for all usage of `ReturnType<typeof graphql.scalar<'<input-name>'>>` there is a corresponding input type in `packages/graphql/src/graphql.ts`

4. **Validate:**
   - Use `pnpm check` from `packages/graphql` to check integrity of GraphQL documents

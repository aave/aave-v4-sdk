---
"@aave/graphql": minor
"@aave/client": minor
"@aave/react": minor
---

**feat:** sync schema with staging: `OrderErc20Approval` joins the `OrderApproval` union (server-built ERC-20 top-up permit, handled by `useLeverage`), `ActivityType.Leverage`, leverage `quoteId` inputs typed as `OrderQuoteId`, and `MarketLeverageQuoteInput.multiplier` is optional

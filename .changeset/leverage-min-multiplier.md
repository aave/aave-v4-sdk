---
"@aave/graphql": minor
"@aave/client": minor
"@aave/react": minor
---

**feat:** `minMultiplier` on `LeverageApprovalsRequired`, where the position stands before the order; a requested `multiplier` must be above it. The leverage `multiplier` now measures the whole position, total collateral over net equity after the order, so bound a leverage input between `minMultiplier` and `maxSafeMultiplier`.
